// Tema warna khusus per kategori (slug WordPress → tema). Warna diatur di app/globals.css
// lewat kelas .gx-ctheme--<tema>. Tambahkan kategori lain di sini, mis. surabaya: CATEGORY_THEMES.jatim.
export const CATEGORY_THEMES = {
	jatim: {
		key: 'nu', // hijau tosca khas Nahdlatul Ulama
		themeColor: '#00875f', // warna bilah browser di HP
		listTitle: 'Terkini di Jawa Timur',
	},
};

export const themeOf = (slug) => CATEGORY_THEMES[decodeURIComponent(slug || '')] || null;
