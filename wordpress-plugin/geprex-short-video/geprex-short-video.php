<?php
/**
 * Plugin Name:       Geprex Short Video
 * Description:       Kelola daftar Short Video (YouTube Shorts) untuk beranda Geprex Next.js dari dasbor WordPress.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Deliknews
 * License:           GPL-2.0-or-later
 * Text Domain:       geprex-short-video
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Geprex_Short_Video {
	const OPTION = 'geprex_short_video';
	const PAGE   = 'geprex-short-video';
	const MAX    = 30;

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'rest' ) );
		add_action( 'update_option_' . self::OPTION, array( __CLASS__, 'revalidate' ), 10, 0 );
		add_action( 'add_option_' . self::OPTION, array( __CLASS__, 'revalidate' ), 10, 0 );
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( __CLASS__, 'links' ) );
	}

	/** Nilai bawaan pengaturan. */
	public static function defaults() {
		return array(
			'enabled'  => 1,
			'title'    => 'Short Video',
			'next_url' => '',
			'secret'   => '',
			'videos'   => array(),
		);
	}

	public static function get() {
		$o = get_option( self::OPTION, array() );
		return wp_parse_args( is_array( $o ) ? $o : array(), self::defaults() );
	}

	/** Angka tombol: bilangan bulat ≥ 0 (negatif/teks → 0). */
	private static function count( $row, $key ) {
		return isset( $row[ $key ] ) ? max( 0, (int) $row[ $key ] ) : 0;
	}

	/** Ambil ID 11 karakter dari link YouTube (shorts, watch, youtu.be, embed) atau ID langsung. */
	public static function parse_id( $value ) {
		$value = trim( (string) $value );
		if ( preg_match( '~^[A-Za-z0-9_-]{11}$~', $value ) ) {
			return $value;
		}
		if ( preg_match( '~(?:youtube\.com/(?:shorts/|embed/|live/|watch\?(?:.*&)?v=)|youtu\.be/)([A-Za-z0-9_-]{11})~', $value, $m ) ) {
			return $m[1];
		}
		return '';
	}

	/** Judul & nama kanal otomatis dari oEmbed YouTube (dipakai bila kolom dikosongkan). */
	private static function oembed( $id ) {
		$key    = 'gxsv_oe_' . $id;
		$cached = get_transient( $key );
		if ( is_array( $cached ) ) {
			return $cached;
		}
		$res = wp_remote_get( 'https://www.youtube.com/oembed?format=json&url=' . rawurlencode( 'https://www.youtube.com/shorts/' . $id ), array( 'timeout' => 8 ) );
		$out = array( 'title' => '', 'channel' => '', 'ok' => false );
		if ( ! is_wp_error( $res ) && 200 === (int) wp_remote_retrieve_response_code( $res ) ) {
			$j = json_decode( wp_remote_retrieve_body( $res ), true );
			if ( is_array( $j ) ) {
				$out = array(
					'title'   => isset( $j['title'] ) ? (string) $j['title'] : '',
					'channel' => isset( $j['author_name'] ) ? (string) $j['author_name'] : '',
					'ok'      => true,
				);
			}
		}
		set_transient( $key, $out, $out['ok'] ? WEEK_IN_SECONDS : HOUR_IN_SECONDS );
		return $out;
	}

	public static function menu() {
		add_menu_page( 'Short Video', 'Short Video', 'manage_options', self::PAGE, array( __CLASS__, 'page' ), 'dashicons-video-alt3', 26 );
	}

	public static function links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'admin.php?page=' . self::PAGE ) ) . '">Kelola video</a>' );
		return $links;
	}

	public static function register() {
		register_setting(
			'geprex_short_video_group',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
				'default'           => self::defaults(),
			)
		);
	}

	public static function sanitize( $input ) {
		$input = is_array( $input ) ? wp_unslash( $input ) : array();
		$prev  = self::get();
		$out   = array(
			'enabled'  => empty( $input['enabled'] ) ? 0 : 1,
			'title'    => sanitize_text_field( isset( $input['title'] ) ? $input['title'] : '' ),
			'next_url' => esc_url_raw( untrailingslashit( trim( isset( $input['next_url'] ) ? $input['next_url'] : '' ) ) ),
			'secret'   => sanitize_text_field( isset( $input['secret'] ) ? $input['secret'] : '' ),
			'videos'   => array(),
		);
		if ( '' === $out['title'] ) {
			$out['title'] = 'Short Video';
		}
		// Kolom kunci dikosongkan = pertahankan kunci lama (tidak ditampilkan ulang di form).
		if ( '' === $out['secret'] && empty( $input['secret_clear'] ) ) {
			$out['secret'] = $prev['secret'];
		}

		$rows    = isset( $input['videos'] ) && is_array( $input['videos'] ) ? array_values( $input['videos'] ) : array();
		$seen    = array();
		$invalid = 0;
		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			// `id` ikut diterima: WordPress menjalankan sanitasi 2x saat opsi pertama kali dibuat.
			$raw = isset( $row['url'] ) ? $row['url'] : ( isset( $row['id'] ) ? $row['id'] : '' );
			if ( '' === trim( (string) $raw ) ) {
				continue; // Baris kosong diabaikan.
			}
			$id = self::parse_id( $raw );
			if ( '' === $id ) {
				$invalid++;
				continue;
			}
			if ( isset( $seen[ $id ] ) || count( $out['videos'] ) >= self::MAX ) {
				continue;
			}
			$seen[ $id ] = true;
			$title       = sanitize_text_field( isset( $row['title'] ) ? $row['title'] : '' );
			$channel     = sanitize_text_field( isset( $row['channel'] ) ? $row['channel'] : '' );
			if ( '' === $title || '' === $channel ) {
				$oe = self::oembed( $id );
				if ( '' === $title ) {
					$title = sanitize_text_field( $oe['title'] );
				}
				if ( '' === $channel ) {
					$channel = sanitize_text_field( $oe['channel'] );
				}
			}
			$out['videos'][] = array(
				'id'       => $id,
				'title'    => $title,
				'channel'  => $channel,
				'likes'    => self::count( $row, 'likes' ),
				'comments' => self::count( $row, 'comments' ),
				'shares'   => self::count( $row, 'shares' ),
			);
		}
		if ( $invalid ) {
			add_settings_error( self::OPTION, 'gxsv_invalid', sprintf( '%d baris dilewati karena link/ID YouTube tidak dikenali.', $invalid ), 'warning' );
		}
		return $out;
	}

	public static function assets( $hook ) {
		if ( 'toplevel_page_' . self::PAGE !== $hook ) {
			return;
		}
		$url = plugin_dir_url( __FILE__ );
		wp_enqueue_style( 'gxsv-admin', $url . 'assets/admin.css', array(), '1.0.0' );
		wp_enqueue_script( 'gxsv-admin', $url . 'assets/admin.js', array(), '1.0.0', true );
	}

	private static function row( $i, $v ) {
		$v    = wp_parse_args( $v, array( 'id' => '', 'title' => '', 'channel' => '', 'likes' => 0, 'comments' => 0, 'shares' => 0 ) );
		$name = self::OPTION . '[videos][' . $i . ']';
		$url  = $v['id'] ? 'https://www.youtube.com/shorts/' . $v['id'] : '';
		?>
		<tr class="gxsv-row">
			<td class="gxsv-thumb"><?php if ( $v['id'] ) : ?><img src="<?php echo esc_url( 'https://i.ytimg.com/vi/' . $v['id'] . '/hqdefault.jpg' ); ?>" alt="" loading="lazy" /><?php endif; ?></td>
			<td>
				<input type="text" class="gxsv-url" name="<?php echo esc_attr( $name ); ?>[url]" value="<?php echo esc_attr( $url ); ?>" placeholder="https://www.youtube.com/shorts/…" />
				<input type="text" name="<?php echo esc_attr( $name ); ?>[title]" value="<?php echo esc_attr( $v['title'] ); ?>" placeholder="Judul (kosongkan = otomatis dari YouTube)" />
				<input type="text" name="<?php echo esc_attr( $name ); ?>[channel]" value="<?php echo esc_attr( $v['channel'] ); ?>" placeholder="Nama kanal (kosongkan = otomatis)" />
			</td>
			<td class="gxsv-nums">
				<label>Suka <input type="number" min="0" name="<?php echo esc_attr( $name ); ?>[likes]" value="<?php echo esc_attr( $v['likes'] ); ?>" /></label>
				<label>Komentar <input type="number" min="0" name="<?php echo esc_attr( $name ); ?>[comments]" value="<?php echo esc_attr( $v['comments'] ); ?>" /></label>
				<label>Bagikan <input type="number" min="0" name="<?php echo esc_attr( $name ); ?>[shares]" value="<?php echo esc_attr( $v['shares'] ); ?>" /></label>
			</td>
			<td class="gxsv-actions">
				<button type="button" class="button gxsv-up" aria-label="Naikkan">&uarr;</button>
				<button type="button" class="button gxsv-down" aria-label="Turunkan">&darr;</button>
				<button type="button" class="button-link-delete gxsv-del">Hapus</button>
			</td>
		</tr>
		<?php
	}

	public static function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$o = self::get();
		?>
		<div class="wrap gxsv">
			<h1>Short Video</h1>
			<p class="description">Video tampil di bawah headline beranda situs Next.js. Tempel link YouTube Shorts; judul &amp; nama kanal yang dikosongkan akan diisi otomatis dari YouTube saat disimpan. Angka suka/komentar/bagikan adalah angka yang ditampilkan di tombol pemutar.</p>
			<?php settings_errors( self::OPTION ); ?>
			<form method="post" action="options.php">
				<?php settings_fields( 'geprex_short_video_group' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row">Tampilkan</th>
						<td><label><input type="checkbox" name="<?php echo esc_attr( self::OPTION ); ?>[enabled]" value="1" <?php checked( $o['enabled'], 1 ); ?> /> Tampilkan Short Video di beranda</label></td>
					</tr>
					<tr>
						<th scope="row"><label for="gxsv-title">Judul bagian</label></th>
						<td><input id="gxsv-title" type="text" class="regular-text" name="<?php echo esc_attr( self::OPTION ); ?>[title]" value="<?php echo esc_attr( $o['title'] ); ?>" /></td>
					</tr>
				</table>

				<h2>Daftar video</h2>
				<table class="widefat gxsv-table">
					<thead><tr><th style="width:70px">Pratinjau</th><th>Link YouTube, judul, kanal</th><th style="width:170px">Angka</th><th style="width:150px">Urutan</th></tr></thead>
					<tbody id="gxsv-rows">
						<?php
						foreach ( array_values( $o['videos'] ) as $i => $v ) {
							self::row( $i, $v );
						}
						?>
					</tbody>
				</table>
				<template id="gxsv-tpl"><?php self::row( '__i__', array() ); ?></template>
				<p><button type="button" class="button" id="gxsv-add">+ Tambah video</button> <span class="description">Maksimal <?php echo (int) self::MAX; ?> video. Baris dengan link kosong diabaikan.</span></p>

				<h2>Perbarui situs Next.js otomatis (opsional)</h2>
				<p class="description">Isi agar perubahan langsung tampil saat disimpan. Tanpa ini, situs memperbarui sendiri dalam ±60 detik.</p>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="gxsv-next">Alamat situs Next.js</label></th>
						<td><input id="gxsv-next" type="url" class="regular-text" name="<?php echo esc_attr( self::OPTION ); ?>[next_url]" value="<?php echo esc_attr( $o['next_url'] ); ?>" placeholder="https://geprex-next.vercel.app" /></td>
					</tr>
					<tr>
						<th scope="row"><label for="gxsv-secret">Kunci revalidasi</label></th>
						<td>
							<input id="gxsv-secret" type="password" class="regular-text" name="<?php echo esc_attr( self::OPTION ); ?>[secret]" value="" autocomplete="new-password" placeholder="<?php echo $o['secret'] ? esc_attr__( '•••••••• (tersimpan — kosongkan untuk tidak mengubah)', 'geprex-short-video' ) : ''; ?>" />
							<p class="description">Sama dengan <code>REVALIDATE_SECRET</code> di Vercel.</p>
							<?php if ( $o['secret'] ) : ?><label><input type="checkbox" name="<?php echo esc_attr( self::OPTION ); ?>[secret_clear]" value="1" /> Hapus kunci tersimpan</label><?php endif; ?>
						</td>
					</tr>
				</table>
				<?php submit_button( 'Simpan' ); ?>
			</form>
			<p class="description">Endpoint data: <code><?php echo esc_html( rest_url( 'geprex-shorts/v1/videos' ) ); ?></code></p>
		</div>
		<?php
	}

	public static function rest() {
		register_rest_route(
			'geprex-shorts/v1',
			'/videos',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => array( __CLASS__, 'rest_videos' ),
			)
		);
	}

	public static function rest_videos() {
		$o = self::get();
		return rest_ensure_response(
			array(
				'enabled' => (bool) $o['enabled'],
				'title'   => $o['title'],
				'videos'  => array_values( $o['videos'] ),
			)
		);
	}

	/** Minta situs Next.js memuat ulang data setelah pengaturan disimpan. */
	public static function revalidate() {
		$o = self::get();
		if ( ! $o['next_url'] || ! $o['secret'] ) {
			return;
		}
		wp_remote_post(
			$o['next_url'] . '/api/revalidate/',
			array(
				'timeout'  => 5,
				'blocking' => false,
				'body'     => array( 'secret' => $o['secret'] ),
			)
		);
	}
}

Geprex_Short_Video::init();
