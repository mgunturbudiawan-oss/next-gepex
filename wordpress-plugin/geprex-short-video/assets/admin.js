// Halaman admin Short Video: tambah, hapus, urutkan baris, dan pratinjau thumbnail.
(function () {
	var rows = document.getElementById('gxsv-rows');
	var tpl = document.getElementById('gxsv-tpl');
	var add = document.getElementById('gxsv-add');
	if (!rows || !tpl || !add) return;

	function parseId(v) {
		v = (v || '').trim();
		if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
		var m = v.match(/(?:youtube\.com\/(?:shorts\/|embed\/|live\/|watch\?(?:.*&)?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
		return m ? m[1] : '';
	}

	// Nama input memakai indeks; susun ulang setelah tambah/hapus/geser agar urutan tersimpan benar.
	function reindex() {
		Array.prototype.forEach.call(rows.querySelectorAll('.gxsv-row'), function (row, i) {
			Array.prototype.forEach.call(row.querySelectorAll('[name]'), function (el) {
				el.name = el.name.replace(/\[videos\]\[[^\]]*\]/, '[videos][' + i + ']');
			});
		});
	}

	function preview(input) {
		var cell = input.closest('.gxsv-row').querySelector('.gxsv-thumb');
		var id = parseId(input.value);
		cell.innerHTML = id ? '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" />' : '';
		input.classList.toggle('gxsv-bad', !!input.value.trim() && !id);
	}

	add.addEventListener('click', function () {
		rows.insertAdjacentHTML('beforeend', tpl.innerHTML);
		reindex();
		var last = rows.lastElementChild;
		if (last) last.querySelector('.gxsv-url').focus();
	});

	rows.addEventListener('click', function (e) {
		var row = e.target.closest('.gxsv-row');
		if (!row) return;
		if (e.target.closest('.gxsv-del')) {
			row.remove();
		} else if (e.target.closest('.gxsv-up') && row.previousElementSibling) {
			rows.insertBefore(row, row.previousElementSibling);
		} else if (e.target.closest('.gxsv-down') && row.nextElementSibling) {
			rows.insertBefore(row.nextElementSibling, row);
		} else {
			return;
		}
		reindex();
	});

	rows.addEventListener('input', function (e) {
		if (e.target.classList.contains('gxsv-url')) preview(e.target);
	});

	if (!rows.querySelector('.gxsv-row')) add.click();
})();
