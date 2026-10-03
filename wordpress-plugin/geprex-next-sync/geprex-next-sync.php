<?php
/**
 * Plugin Name:       Geprex Next Sync (Anti Blokir)
 * Description:       Mengirim data berita dari WordPress ke situs Next.js (Vercel). Vercel tidak perlu lagi meminta data ke hosting, jadi tidak terkena blokir firewall / reCAPTCHA hosting.
 * Version:           1.0.1
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Deliknews
 * License:           GPL-2.0-or-later
 * Text Domain:       geprex-next-sync
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Geprex_Next_Sync {
	const OPTION = 'geprex_next_sync';
	const LAST   = 'geprex_next_sync_last';
	const PAGE   = 'geprex-next-sync';
	const HOURLY = 'gxns_hourly';
	const POST   = 'gxns_push_post';
	const CORE   = 'gxns_push_core';
	const BATCH  = 20;       // artikel per kiriman "Kirim semua artikel"
	const CHUNK  = 3000000;  // byte per permintaan ke Vercel (batas Vercel 4,5 MB)
	const RECENT = 30;       // artikel terbaru yang selalu ikut dikirim bersama data utama

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( __CLASS__, 'links' ) );

		// Otomatis: berita terbit/diubah/dihapus, komentar disetujui, dan setiap jam.
		add_action( 'transition_post_status', array( __CLASS__, 'on_status' ), 10, 3 );
		add_action( 'comment_post', array( __CLASS__, 'on_comment' ), 10, 2 );
		add_action( 'wp_set_comment_status', array( __CLASS__, 'on_comment_status' ), 10, 2 );
		add_action( 'customize_save_after', array( __CLASS__, 'queue_core' ) );
		add_action( 'update_option_geprex_short_video', array( __CLASS__, 'queue_core' ) );
		add_action( self::POST, array( __CLASS__, 'push_post' ) );
		add_action( self::CORE, array( __CLASS__, 'push_core' ) );
		add_action( self::HOURLY, array( __CLASS__, 'push_hourly' ) );

		add_action( 'wp_ajax_gxns_test', array( __CLASS__, 'ajax_test' ) );
		add_action( 'wp_ajax_gxns_core', array( __CLASS__, 'ajax_core' ) );
		add_action( 'wp_ajax_gxns_posts', array( __CLASS__, 'ajax_posts' ) );

		register_activation_hook( __FILE__, array( __CLASS__, 'activate' ) );
		register_deactivation_hook( __FILE__, array( __CLASS__, 'deactivate' ) );
	}

	public static function activate() {
		if ( ! wp_next_scheduled( self::HOURLY ) ) {
			wp_schedule_event( time() + 120, 'hourly', self::HOURLY );
		}
	}

	public static function deactivate() {
		wp_clear_scheduled_hook( self::HOURLY );
	}

	/* ------------------------------------------------------------------ Pengaturan */

	public static function defaults() {
		return array( 'next_url' => '', 'secret' => '', 'auto' => 1 );
	}

	public static function get() {
		$o = get_option( self::OPTION, array() );
		return wp_parse_args( is_array( $o ) ? $o : array(), self::defaults() );
	}

	public static function register() {
		register_setting( 'gxns_group', self::OPTION, array( 'type' => 'array', 'sanitize_callback' => array( __CLASS__, 'sanitize' ), 'default' => self::defaults() ) );
	}

	public static function sanitize( $in ) {
		$in   = is_array( $in ) ? wp_unslash( $in ) : array();
		$prev = self::get();
		$out  = array(
			'next_url' => esc_url_raw( untrailingslashit( trim( isset( $in['next_url'] ) ? $in['next_url'] : '' ) ) ),
			'secret'   => sanitize_text_field( isset( $in['secret'] ) ? $in['secret'] : '' ),
			'auto'     => empty( $in['auto'] ) ? 0 : 1,
		);
		// Kolom kunci dikosongkan = pertahankan kunci lama (tidak ditampilkan ulang di form).
		if ( '' === $out['secret'] ) {
			$out['secret'] = $prev['secret'];
		}
		return $out;
	}

	public static function menu() {
		add_options_page( 'Next Sync (Anti Blokir)', 'Next Sync', 'manage_options', self::PAGE, array( __CLASS__, 'page' ) );
	}

	public static function links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=' . self::PAGE ) ) . '">Pengaturan</a>' );
		return $links;
	}

	/* ------------------------------------------------------------------ Data */

	/** Kunci data = endpoint + parameter terurut abjad (sama dengan dataKey() di Next.js). */
	public static function key( $endpoint, $params = array() ) {
		$params = array_filter( $params, function ( $v ) { return null !== $v && '' !== $v; } );
		ksort( $params );
		$qs = http_build_query( $params, '', '&', PHP_QUERY_RFC1738 );
		return '' === $qs ? $endpoint : $endpoint . '?' . $qs;
	}

	/** Panggil REST API WordPress sendiri secara internal (tanpa HTTP, jadi tidak terkena firewall). */
	private static function internal( $route, $params = array() ) {
		$saved_get = $_GET; // Sebagian kode tema mungkin membaca $_GET langsung.
		$_GET      = $params;
		$req       = new WP_REST_Request( 'GET', $route );
		$req->set_query_params( $params );
		$res       = rest_do_request( $req );
		$data      = rest_get_server()->response_to_data( $res, false );
		$_GET      = $saved_get;
		return array( (int) $res->get_status(), $data );
	}

	/** Satu entri data siap kirim; null bila gagal diambil. */
	private static function item( $endpoint, $params = array() ) {
		$params = array_map( 'strval', $params );
		list( $status, $data ) = self::internal( '/geprex/v1/hl/' . $endpoint, $params );
		$key = self::key( $endpoint, $params );
		if ( 200 === $status ) {
			return array( 'key' => $key, 'status' => 200, 'data' => $data );
		}
		if ( 404 === $status ) {
			return array( 'key' => $key, 'status' => 404 );
		}
		if ( 403 === $status && is_array( $data ) && isset( $data['code'] ) && 'geprex_unlicensed' === $data['code'] ) {
			return array( 'key' => $key, 'status' => 'unlicensed', 'message' => isset( $data['message'] ) ? $data['message'] : '' );
		}
		return null;
	}

	/** Slug seperti yang dibaca Next.js dari URL (sudah di-decode). */
	private static function slug( $post ) {
		return rawurldecode( $post->post_name );
	}

	/** Data utama: pengaturan, beranda, sitemap, indeks, "muat lebih banyak" beranda, Short Video. */
	private static function core_items() {
		$items = array( self::item( 'config' ) );
		$home  = self::item( 'home' );
		$items[] = $home;
		$items[] = self::item( 'sitemap' );
		$items[] = self::item( 'indeks', array( 'page' => 1 ) );
		if ( $home && 200 === $home['status'] && is_array( $home['data'] ) ) {
			$exclude = isset( $home['data']['exclude'] ) ? implode( ',', array_map( 'intval', (array) $home['data']['exclude'] ) ) : '';
			for ( $p = 2; $p <= 4; $p++ ) {
				$items[] = self::item( 'list', array( 'type' => 'latest', 'exclude' => $exclude, 'page' => $p ) );
			}
		}
		// Artikel terbaru (yang tampil di beranda) selalu ikut dikirim, agar bisa dibuka tanpa "Kirim semua artikel".
		foreach ( get_posts( array( 'post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => self::RECENT, 'no_found_rows' => true ) ) as $p ) {
			$items[] = self::item( 'post', array( 'slug' => self::slug( $p ) ) );
		}
		$routes = rest_get_server()->get_routes();
		if ( isset( $routes['/geprex-shorts/v1/videos'] ) ) {
			list( $status, $data ) = self::internal( '/geprex-shorts/v1/videos' );
			if ( 200 === $status ) {
				$items[] = array( 'key' => 'shorts', 'status' => 200, 'data' => $data );
			}
		}
		return array_values( array_filter( $items ) );
	}

	/** Halaman pertama semua kategori yang punya berita. */
	private static function category_items() {
		$items = array();
		foreach ( get_terms( array( 'taxonomy' => 'category', 'hide_empty' => true ) ) as $t ) {
			$items[] = self::item( 'list', array( 'type' => 'category', 'slug' => rawurldecode( $t->slug ) ) );
		}
		return array_values( array_filter( $items ) );
	}

	/** Artikel + daftar terkait (kategori, tag, penulis). */
	private static function post_items( $post, $with_lists = true ) {
		$items = array( self::item( 'post', array( 'slug' => self::slug( $post ) ) ) );
		if ( $with_lists ) {
			foreach ( wp_get_post_categories( $post->ID, array( 'fields' => 'slugs' ) ) as $slug ) {
				$items[] = self::item( 'list', array( 'type' => 'category', 'slug' => rawurldecode( $slug ) ) );
				$items[] = self::item( 'list', array( 'type' => 'category', 'slug' => rawurldecode( $slug ), 'page' => 2 ) );
			}
			foreach ( wp_get_post_tags( $post->ID, array( 'fields' => 'slugs' ) ) as $slug ) {
				$items[] = self::item( 'list', array( 'type' => 'tag', 'slug' => rawurldecode( $slug ) ) );
			}
			$author = get_userdata( $post->post_author );
			if ( $author ) {
				$items[] = self::item( 'list', array( 'type' => 'author', 'slug' => $author->user_nicename ) );
			}
		}
		return array_values( array_filter( $items ) );
	}

	/* ------------------------------------------------------------------ Kirim */

	/** Kirim entri ke Next.js (/api/sync/) dalam beberapa permintaan. Hasil: jumlah tersimpan atau WP_Error. */
	public static function send( $items ) {
		$o = self::get();
		if ( ! $o['next_url'] || ! $o['secret'] ) {
			return new WP_Error( 'gxns_config', 'Isi dulu Alamat situs Next.js dan Kunci.' );
		}
		$chunks = array();
		$cur    = array();
		$size   = 0;
		foreach ( $items as $it ) {
			$len = strlen( wp_json_encode( $it ) );
			if ( $cur && $size + $len > self::CHUNK ) {
				$chunks[] = $cur;
				$cur      = array();
				$size     = 0;
			}
			$cur[] = $it;
			$size += $len;
		}
		if ( $cur || ! $chunks ) {
			$chunks[] = $cur;
		}
		$saved = 0;
		foreach ( $chunks as $chunk ) {
			$res = wp_remote_post(
				$o['next_url'] . '/api/sync/',
				array(
					'timeout' => 45,
					'headers' => array( 'Content-Type' => 'application/json', 'X-Geprex-Secret' => $o['secret'] ),
					'body'    => wp_json_encode( array( 'items' => $chunk ) ),
				)
			);
			if ( is_wp_error( $res ) ) {
				self::log( false, $res->get_error_message() );
				return $res;
			}
			$code = (int) wp_remote_retrieve_response_code( $res );
			$body = json_decode( wp_remote_retrieve_body( $res ), true );
			if ( 200 !== $code ) {
				$msg = is_array( $body ) && ! empty( $body['error'] ) ? $body['error'] : 'HTTP ' . $code;
				self::log( false, $msg );
				return new WP_Error( 'gxns_http', $msg );
			}
			$saved += is_array( $body ) && isset( $body['saved'] ) ? (int) $body['saved'] : 0;
		}
		self::log( true, sprintf( '%d data terkirim', $saved ) );
		return $saved;
	}

	private static function log( $ok, $msg ) {
		update_option( self::LAST, array( 'time' => time(), 'ok' => $ok, 'msg' => $msg ), false );
	}

	/* ------------------------------------------------------------------ Otomatis */

	public static function on_status( $new, $old, $post ) {
		if ( 'post' !== $post->post_type || ! self::get()['auto'] ) {
			return;
		}
		if ( 'publish' === $new || 'publish' === $old ) {
			self::queue( self::POST, array( $post->ID ) );
		}
	}

	public static function on_comment( $comment_id, $approved ) {
		if ( 1 === (int) $approved ) {
			self::on_comment_status( $comment_id, 'approve' );
		}
	}

	public static function on_comment_status( $comment_id, $status ) {
		$c = get_comment( $comment_id );
		if ( $c && self::get()['auto'] ) {
			self::queue( self::POST, array( (int) $c->comment_post_ID ) );
		}
	}

	public static function queue_core() {
		if ( self::get()['auto'] ) {
			self::queue( self::CORE, array() );
		}
	}

	/** Jadwalkan di latar belakang agar tombol Terbitkan tetap cepat. */
	private static function queue( $hook, $args ) {
		if ( ! wp_next_scheduled( $hook, $args ) ) {
			wp_schedule_single_event( time() + 5, $hook, $args );
		}
		if ( function_exists( 'spawn_cron' ) ) {
			spawn_cron();
		}
	}

	public static function push_post( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return;
		}
		if ( 'publish' === $post->post_status ) {
			$items = self::post_items( $post );
		} else {
			// Tidak terbit lagi (draf / sampah): tandai artikel tidak ada.
			$items = array( array( 'key' => self::key( 'post', array( 'slug' => preg_replace( '/__trashed$/', '', self::slug( $post ) ) ) ), 'status' => 404 ) );
		}
		self::send( array_merge( $items, self::core_items() ) );
	}

	public static function push_core() {
		self::send( self::core_items() );
	}

	public static function push_hourly() {
		if ( self::get()['auto'] ) {
			self::send( array_merge( self::core_items(), self::category_items() ) );
		}
	}

	/* ------------------------------------------------------------------ Tombol admin (AJAX) */

	private static function guard() {
		if ( ! current_user_can( 'manage_options' ) || ! check_ajax_referer( 'gxns', 'nonce', false ) ) {
			wp_send_json_error( array( 'message' => 'Tidak diizinkan.' ), 403 );
		}
		if ( function_exists( 'set_time_limit' ) ) {
			@set_time_limit( 180 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
		}
	}

	private static function reply( $result, $extra = array() ) {
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}
		wp_send_json_success( array_merge( array( 'saved' => (int) $result ), $extra ) );
	}

	public static function ajax_test() {
		self::guard();
		self::reply( self::send( array() ), array( 'message' => 'Terhubung: kunci cocok dan penyimpanan Vercel aktif.' ) );
	}

	public static function ajax_core() {
		self::guard();
		self::reply( self::send( array_merge( self::core_items(), self::category_items() ) ) );
	}

	public static function ajax_posts() {
		self::guard();
		$offset = isset( $_POST['offset'] ) ? absint( $_POST['offset'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
		$posts  = get_posts( array( 'post_type' => 'post', 'post_status' => 'publish', 'orderby' => 'date', 'order' => 'DESC', 'posts_per_page' => self::BATCH, 'offset' => $offset, 'no_found_rows' => true ) );
		$items  = array();
		foreach ( $posts as $p ) {
			$items = array_merge( $items, self::post_items( $p, false ) );
		}
		$total = (int) wp_count_posts( 'post' )->publish;
		self::reply( $items ? self::send( $items ) : 0, array( 'next' => $offset + count( $posts ), 'total' => $total, 'done' => count( $posts ) < self::BATCH ) );
	}

	/* ------------------------------------------------------------------ Halaman admin */

	public static function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$o    = self::get();
		$last = get_option( self::LAST );
		?>
		<div class="wrap">
			<h1>Next Sync (Anti Blokir)</h1>
			<p>WordPress mengirim data berita ke situs Next.js, jadi Vercel tidak perlu meminta data ke hosting ini dan tidak terkena blokir firewall/reCAPTCHA. Pengiriman otomatis saat berita terbit/diubah/dihapus, saat komentar disetujui, dan setiap jam.</p>
			<?php if ( $last ) : ?>
				<div class="notice <?php echo $last['ok'] ? 'notice-success' : 'notice-error'; ?> inline"><p><strong>Pengiriman terakhir:</strong> <?php echo esc_html( human_time_diff( $last['time'] ) . ' lalu — ' . $last['msg'] ); ?></p></div>
			<?php endif; ?>
			<form method="post" action="options.php">
				<?php settings_fields( 'gxns_group' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="gxns-url">Alamat situs Next.js</label></th>
						<td><input id="gxns-url" type="url" class="regular-text" name="<?php echo esc_attr( self::OPTION ); ?>[next_url]" value="<?php echo esc_attr( $o['next_url'] ); ?>" placeholder="https://next-gepex.vercel.app" required /></td>
					</tr>
					<tr>
						<th scope="row"><label for="gxns-secret">Kunci</label></th>
						<td>
							<input id="gxns-secret" type="password" class="regular-text" name="<?php echo esc_attr( self::OPTION ); ?>[secret]" value="" autocomplete="new-password" placeholder="<?php echo $o['secret'] ? esc_attr( '•••••••• (tersimpan — kosongkan untuk tidak mengubah)' ) : ''; ?>" />
							<p class="description">Sama dengan <code>REVALIDATE_SECRET</code> di Environment Variables Vercel.</p>
						</td>
					</tr>
					<tr>
						<th scope="row">Otomatis</th>
						<td><label><input type="checkbox" name="<?php echo esc_attr( self::OPTION ); ?>[auto]" value="1" <?php checked( $o['auto'], 1 ); ?> /> Kirim otomatis saat ada perubahan &amp; setiap jam</label></td>
					</tr>
				</table>
				<?php submit_button( 'Simpan pengaturan' ); ?>
			</form>

			<h2>Kirim sekarang</h2>
			<p>
				<button type="button" class="button" data-gxns="test">Uji koneksi</button>
				<button type="button" class="button button-primary" data-gxns="core">Kirim data utama</button>
				<button type="button" class="button" data-gxns="posts">Kirim semua artikel</button>
			</p>
			<p class="description">Pertama kali: klik <strong>Kirim data utama</strong> (beranda, pengaturan, semua kategori, sitemap), lalu <strong>Kirim semua artikel</strong> agar artikel lama juga bisa dibuka. Biarkan halaman ini terbuka sampai selesai.</p>
			<div id="gxns-log" style="margin-top:12px;padding:10px 12px;background:#fff;border:1px solid #c3c4c7;max-height:260px;overflow:auto;font-family:monospace;font-size:12px;display:none"></div>
		</div>
		<script>
		(function () {
			var ajax = <?php echo wp_json_encode( admin_url( 'admin-ajax.php' ) ); ?>;
			var nonce = <?php echo wp_json_encode( wp_create_nonce( 'gxns' ) ); ?>;
			var log = document.getElementById('gxns-log');
			var busy = false;
			function say(t) { log.style.display = 'block'; log.textContent += t + '\n'; log.scrollTop = log.scrollHeight; }
			function call(action, extra) {
				var f = new FormData();
				f.append('action', 'gxns_' + action);
				f.append('nonce', nonce);
				Object.keys(extra || {}).forEach(function (k) { f.append(k, extra[k]); });
				return fetch(ajax, { method: 'POST', body: f, credentials: 'same-origin' }).then(function (r) { return r.json(); });
			}
			function posts(offset) {
				return call('posts', { offset: offset }).then(function (r) {
					if (!r.success) throw new Error(r.data && r.data.message || 'Gagal');
					say('Artikel ' + Math.min(r.data.next, r.data.total) + ' / ' + r.data.total + ' terkirim');
					return r.data.done ? null : posts(r.data.next);
				});
			}
			document.querySelectorAll('[data-gxns]').forEach(function (b) {
				b.addEventListener('click', function () {
					if (busy) return;
					busy = true;
					var act = b.getAttribute('data-gxns');
					say('— ' + b.textContent + '…');
					var job = act === 'posts' ? posts(0) : call(act).then(function (r) {
						if (!r.success) throw new Error(r.data && r.data.message || 'Gagal');
						say(r.data.message || (r.data.saved + ' data terkirim'));
					});
					job.then(function () { say('Selesai.'); }).catch(function (e) { say('GAGAL: ' + e.message); }).then(function () { busy = false; });
				});
			});
		})();
		</script>
		<?php
	}
}

Geprex_Next_Sync::init();
