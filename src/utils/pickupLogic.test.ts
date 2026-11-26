import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ESTIMATE_LABEL,
  DEFAULT_PICKUP_POINTS,
  OPERATOR_LIST,
} from '../data/defaultPickupPoints';
import {
  buildPublicPassengerUrl,
  DUPLICATE_COMBO_ERROR,
  evaluateVehicleChecklist,
  findDuplicatePickupPoint,
  findMatchingPoint,
  formatIndonesianDate,
  getOperatorsForExit,
  getUniqueExits,
  isPassengerModeFromSearch,
  isSafeHttpUrl,
  normalizePickupPoints,
  parsePassengerQueryParams,
  resolveInitialSelection,
  validatePickupPointForm,
  wrapLabelLines,
} from './pickupLogic';
import { generateQrMatrix } from './qrGenerator';
import { getMapHighlightState } from './mapHighlight';

test('default seed data maintains honesty rules and covers Gojek, Grab, and Maxim', () => {
  assert.equal(DEFAULT_PICKUP_POINTS.length, 3);
  const operators = DEFAULT_PICKUP_POINTS.map((p) => p.operator);
  assert.deepEqual(operators, OPERATOR_LIST);

  for (const point of DEFAULT_PICKUP_POINTS) {
    assert.equal(point.statusVerifikasi, 'Simulasi');
    assert.equal(point.estimasiJalanKaki, DEFAULT_ESTIMATE_LABEL);
    assert.equal(point.namaTitikTemu, 'Area Bawah Jembatan Gubeng (Simulasi)');
    assert.equal(
      point.pesanPeringatan.toLowerCase().includes('resmi dari stasiun'),
      false,
    );
    assert.equal(point.estimasiJalanKaki.includes('5–7'), false);
  }
});

test('validatePickupPointForm rejects empty and short (< 3 chars) required fields', () => {
  const res = validatePickupPointForm({
    pintuKeluar: 'AB',
    operator: 'Gojek',
    namaTitikTemu: '',
    pesanPeringatan: 'hi',
    penandaA: ' ',
    penandaB: 'OK',
    penandaC: '12',
    estimasiJalanKaki: '',
    statusVerifikasi: 'Simulasi',
    sumberInformasi: 'a',
    tanggalPemeriksaan: '',
  });

  assert.equal(res.valid, false);
  assert.ok(res.errors.pintuKeluar);
  assert.ok(res.errors.namaTitikTemu);
  assert.ok(res.errors.pesanPeringatan);
  assert.ok(res.errors.penandaA);
  assert.ok(res.errors.penandaB);
  assert.ok(res.errors.penandaC);
  assert.ok(res.errors.sumberInformasi);
  assert.ok(res.errors.tanggalPemeriksaan);
  assert.equal(res.errors.estimasiJalanKaki, undefined);
});

test('validatePickupPointForm auto-fills default estimate when left empty', () => {
  const res = validatePickupPointForm({
    pintuKeluar: 'Pintu Keluar Selatan Gubeng Lama',
    operator: 'Grab',
    namaTitikTemu: 'Halte Uji Selatan Gubeng',
    pesanPeringatan: 'Jangan menunggu di mulut gerbang keluar stasiun.',
    penandaA: 'Pintu keluar sisi selatan stasiun.',
    penandaB: 'Ikuti trotoar beratap sepanjang pagar.',
    penandaC: 'Area tunggu sebelah selatan dekat rambu.',
    estimasiJalanKaki: '   ',
    statusVerifikasi: 'Terkonfirmasi',
    sumberInformasi: 'Survei Lapangan Relawan Q3',
    tanggalPemeriksaan: '2026-11-22',
  });

  assert.equal(res.valid, true);
  assert.equal(res.sanitized?.estimasiJalanKaki, 'Menunggu uji dry run');
  assert.equal(res.sanitized?.statusVerifikasi, 'Terkonfirmasi');
});

test('rejects duplicate (pintuKeluar + operator) case-insensitively while allowing self-edit', () => {
  const duplicateInput = {
    pintuKeluar: '  pintu keluar stasiun gubeng lama  ',
    operator: 'Gojek' as const,
    namaTitikTemu: 'Titik Duplikat Uji',
    pesanPeringatan: 'Peringatan untuk data uji duplikat.',
    penandaA: 'Area awal pintu keluar stasiun.',
    penandaB: 'Jalur trotoar sisi kiri stasiun.',
    penandaC: 'Titik temu area bawah jembatan.',
    estimasiJalanKaki: '',
    statusVerifikasi: 'Simulasi' as const,
    sumberInformasi: 'Tim Uji Q3.05',
    tanggalPemeriksaan: '2026-11-26',
  };

  assert.ok(
    findDuplicatePickupPoint(
      DEFAULT_PICKUP_POINTS,
      duplicateInput.pintuKeluar,
      duplicateInput.operator,
    ),
  );

  // Creating new entry with duplicate combo must fail
  const createRes = validatePickupPointForm(duplicateInput, DEFAULT_PICKUP_POINTS);
  assert.equal(createRes.valid, false);
  assert.equal(createRes.duplicateError, DUPLICATE_COMBO_ERROR);
  assert.equal(createRes.errors.pintuKeluar, DUPLICATE_COMBO_ERROR);

  // Editing the same record ID must succeed
  const editSelfRes = validatePickupPointForm(
    duplicateInput,
    DEFAULT_PICKUP_POINTS,
    'gubeng-lama-gojek',
  );
  assert.equal(editSelfRes.valid, true);
  assert.equal(editSelfRes.duplicateError, undefined);

  // Editing a different record ID to collide with gubeng-lama-gojek must fail
  const editCollisionRes = validatePickupPointForm(
    duplicateInput,
    DEFAULT_PICKUP_POINTS,
    'gubeng-lama-grab',
  );
  assert.equal(editCollisionRes.valid, false);
  assert.equal(editCollisionRes.duplicateError, DUPLICATE_COMBO_ERROR);
});

test('dynamic exit and operator resolution works across multiple exits', () => {
  const extended = [
    ...DEFAULT_PICKUP_POINTS,
    {
      ...DEFAULT_PICKUP_POINTS[0],
      id: 'pintu-barat-maxim',
      pintuKeluar: 'Pintu Keluar Barat (Uji)',
      operator: 'Maxim' as const,
      namaTitikTemu: 'Taman Sisi Barat (Simulasi)',
    },
  ];

  const exits = getUniqueExits(extended);
  assert.deepEqual(exits, [
    'Pintu Keluar Stasiun Gubeng Lama',
    'Pintu Keluar Barat (Uji)',
  ]);
  assert.deepEqual(getOperatorsForExit(extended, 'Pintu Keluar Barat (Uji)'), [
    'Maxim',
  ]);
  const matched = findMatchingPoint(extended, 'Pintu Keluar Barat (Uji)', 'Gojek');
  assert.equal(matched?.id, 'pintu-barat-maxim');
});

test('evaluateVehicleChecklist enforces 3/3 completion and reports missing keys', () => {
  const empty = evaluateVehicleChecklist({
    pelatSesuai: false,
    jenisWarnaSesuai: false,
    namaPengemudiSesuai: false,
  });
  assert.equal(empty.checkedCount, 0);
  assert.equal(empty.isComplete, false);
  assert.equal(empty.missingKeys.length, 3);

  const partial = evaluateVehicleChecklist({
    pelatSesuai: true,
    jenisWarnaSesuai: false,
    namaPengemudiSesuai: true,
  });
  assert.equal(partial.checkedCount, 2);
  assert.equal(partial.isComplete, false);
  assert.deepEqual(partial.missingKeys, ['jenisWarnaSesuai']);

  const full = evaluateVehicleChecklist({
    pelatSesuai: true,
    jenisWarnaSesuai: true,
    namaPengemudiSesuai: true,
  });
  assert.equal(full.checkedCount, 3);
  assert.equal(full.isComplete, true);
  assert.deepEqual(full.missingKeys, []);
});

test('parses ?mode=penumpang&pintu=...&operator=... and resolves initial passenger selection', () => {
  const extended = [
    ...DEFAULT_PICKUP_POINTS,
    {
      ...DEFAULT_PICKUP_POINTS[1],
      id: 'utara-grab',
      pintuKeluar: 'Pintu Keluar Utara Gubeng Lama',
      operator: 'Grab' as const,
      namaTitikTemu: 'Shelter Utara (Simulasi)',
    },
    {
      ...DEFAULT_PICKUP_POINTS[2],
      id: 'utara-maxim',
      pintuKeluar: 'Pintu Keluar Utara Gubeng Lama',
      operator: 'Maxim' as const,
      namaTitikTemu: 'Shelter Utara Maxim (Simulasi)',
    },
  ];

  const parsed = parsePassengerQueryParams(
    '?mode=penumpang&pintu=Pintu+Keluar+Utara+Gubeng+Lama&operator=maxim',
  );
  assert.equal(parsed.isPassengerMode, true);
  assert.equal(parsed.pintu, 'Pintu Keluar Utara Gubeng Lama');
  assert.equal(parsed.operator, 'Maxim');

  const resolvedExact = resolveInitialSelection(extended, parsed);
  assert.equal(resolvedExact.selectedExit, 'Pintu Keluar Utara Gubeng Lama');
  assert.equal(resolvedExact.selectedOperator, 'Maxim');

  // If operator isn't registered for that exit, fallback to first operator of that exit
  const resolvedFallbackOp = resolveInitialSelection(extended, {
    pintu: 'pintu keluar utara gubeng lama',
    operator: 'Gojek',
  });
  assert.equal(resolvedFallbackOp.selectedExit, 'Pintu Keluar Utara Gubeng Lama');
  assert.equal(resolvedFallbackOp.selectedOperator, 'Grab');

  // Mode detection still works cleanly
  assert.equal(isPassengerModeFromSearch('?mode=penumpang'), true);
  assert.equal(isPassengerModeFromSearch('?foo=1&mode=PENUMPANG'), true);
  assert.equal(isPassengerModeFromSearch('?mode=kelola'), false);
  assert.equal(isPassengerModeFromSearch(''), false);
});

test('buildPublicPassengerUrl updates URL with target pintu parameter and validates safe HTTP URLs', () => {
  assert.equal(
    buildPublicPassengerUrl('https:', 'https://gubeng.app', '/'),
    'https://gubeng.app/?mode=penumpang',
  );
  assert.equal(
    buildPublicPassengerUrl(
      'https:',
      'https://gubeng.app',
      '/',
      'Pintu Keluar Utara Gubeng Lama',
    ),
    'https://gubeng.app/?mode=penumpang&pintu=Pintu+Keluar+Utara+Gubeng+Lama',
  );
  assert.equal(
    buildPublicPassengerUrl('file:', 'null', '/index.html'),
    'https://jemputjelasgubeng.example/?mode=penumpang',
  );

  assert.equal(isSafeHttpUrl('https://gubeng.app/?mode=penumpang'), true);
  assert.equal(isSafeHttpUrl('http://localhost:3000/?mode=penumpang'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,hi'), false);
  assert.equal(formatIndonesianDate('2026-11-22'), '22 Nov 2026');
});

test('normalizePickupPoints gracefully falls back on malformed localStorage data', () => {
  const fallback = normalizePickupPoints('invalid-json');
  assert.equal(fallback.length, 3);
  const partialFallback = normalizePickupPoints([{ bad: true }]);
  assert.equal(partialFallback.length, 3);
});

test('generateQrMatrix produces a valid scannable QR code with finder patterns', () => {
  const qr = generateQrMatrix('https://gubeng.app/?mode=penumpang');
  assert.ok(qr.size >= 21, 'QR version 1+ must be at least 21x21 modules');
  assert.equal(qr.modules.length, qr.size);
  assert.equal(qr.modules[0].length, qr.size);
  assert.equal(qr.modules[0][0], true);
  assert.equal(qr.modules[1][1], false);
  assert.equal(qr.modules[2][2], true);
  assert.ok(qr.svgPath.length > 100);
});

test('wrapLabelLines wraps destination names cleanly within max line width', () => {
  const lines = wrapLabelLines('Area Bawah Jembatan Gubeng (Simulasi)', 22, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines[0].length <= 22);
  assert.ok(lines[1].length <= 22);
  assert.equal(lines[0], 'Area Bawah Jembatan');
  assert.equal(lines[1], 'Gubeng (Simulasi)');
});

test('getMapHighlightState switches distinct marker colors and zone emphasis for A, B, and C', () => {
  const stateA = getMapHighlightState('A');
  const stateB = getMapHighlightState('B');
  const stateC = getMapHighlightState('C');

  assert.equal(stateA.markers.A.isActive, true);
  assert.equal(stateA.markers.B.isActive, false);
  assert.equal(stateA.markers.C.isActive, false);
  assert.equal(stateA.station.strokeWidth, 3);
  assert.notEqual(stateA.markers.A.fill, stateB.markers.B.fill);
  assert.notEqual(stateB.markers.B.fill, stateC.markers.C.fill);

  assert.equal(stateB.markers.B.isActive, true);
  assert.notEqual(stateB.sidewalk.fill, stateA.sidewalk.fill);

  assert.equal(stateC.markers.C.isActive, true);
  assert.notEqual(stateC.destination.fill, stateA.destination.fill);
  assert.equal(stateC.destination.strokeWidth, 3);
});
