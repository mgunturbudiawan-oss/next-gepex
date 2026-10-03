<?php
// Hapus pengaturan saat plugin dihapus dari WordPress.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'geprex_next_sync' );
delete_option( 'geprex_next_sync_last' );
wp_clear_scheduled_hook( 'gxns_hourly' );
