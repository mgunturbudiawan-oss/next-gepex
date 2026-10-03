<?php
// Hapus pengaturan saat plugin dihapus dari WordPress.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'geprex_short_video' );
