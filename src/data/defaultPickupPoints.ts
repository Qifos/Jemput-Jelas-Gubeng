import { OperatorId, PickupPointData } from '../types';

export const DEFAULT_ESTIMATE_LABEL = 'Menunggu uji dry run';

export const OPERATOR_LIST: OperatorId[] = ['Gojek', 'Grab', 'Maxim'];

export interface OperatorFallbackInfo {
  id: OperatorId;
  name: string;
  tagline: string;
  url: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

export const OPERATOR_FALLBACKS: OperatorFallbackInfo[] = [
  {
    id: 'Gojek',
    name: 'Gojek',
    tagline: 'GoRide & GoCar — buka layanan resmi untuk memesan dan chat pengemudi',
    url: 'https://www.gojek.com/id-id',
    accentBg: 'bg-[#e9f7ef]',
    accentText: 'text-[#00880c]',
    accentBorder: 'border-[#b7e4c7]',
  },
  {
    id: 'Grab',
    name: 'Grab',
    tagline: 'GrabBike & GrabCar — buka layanan resmi untuk memesan dan chat pengemudi',
    url: 'https://www.grab.com/id/',
    accentBg: 'bg-[#e7f8ee]',
    accentText: 'text-[#009c49]',
    accentBorder: 'border-[#b3e6c9]',
  },
  {
    id: 'Maxim',
    name: 'Maxim',
    tagline: 'Bike & Car — buka layanan resmi untuk memesan dan chat pengemudi',
    url: 'https://id.taximaxim.com/',
    accentBg: 'bg-[#fff7dc]',
    accentText: 'text-[#8a6500]',
    accentBorder: 'border-[#f3dd8c]',
  },
];

export const DEFAULT_PICKUP_POINTS: PickupPointData[] = [
  {
    id: 'gubeng-lama-gojek',
    pintuKeluar: 'Pintu Keluar Stasiun Gubeng Lama',
    operator: 'Gojek',
    namaTitikTemu: 'Area Bawah Jembatan Gubeng (Simulasi)',
    pesanPeringatan:
      'Jangan menunggu tepat di depan pintu keluar stasiun agar tidak menghambat alur penumpang dan kendaraan. Pada skenario uji ini, titik temu Gojek diarahkan ke area bawah jembatan; pastikan kembali titik temu dengan pengemudi melalui chat di aplikasi.',
    penandaA:
      'Keluar dari gerbang kedatangan Stasiun Gubeng Lama menuju sisi trotoar utama di tepi halaman stasiun. Jangan berhenti di bahu jalan depan gerbang.',
    penandaB:
      'Ikuti jalur trotoar pejalan kaki ke arah jembatan penyeberangan/viaduk Gubeng. Tetap berada di sisi dalam trotoar dan waspadai sepeda motor yang parkir.',
    penandaC:
      'Area Bawah Jembatan Gubeng (Simulasi) — tunggu di ruang pejalan kaki yang terang dan lapang di dekat pilar jembatan, lalu konfirmasi posisi Anda ke pengemudi Gojek via chat aplikasi.',
    estimasiJalanKaki: DEFAULT_ESTIMATE_LABEL,
    statusVerifikasi: 'Simulasi',
    sumberInformasi: 'Tim Uji Purwarupa Jemput Jelas Gubeng (Data Simulasi Awal)',
    tanggalPemeriksaan: '2026-11-22',
  },
  {
    id: 'gubeng-lama-grab',
    pintuKeluar: 'Pintu Keluar Stasiun Gubeng Lama',
    operator: 'Grab',
    namaTitikTemu: 'Area Bawah Jembatan Gubeng (Simulasi)',
    pesanPeringatan:
      'Hindari menunggu langsung di depan pintu keluar Stasiun Gubeng Lama. Untuk skenario uji Grab, titik temu diarahkan ke area bawah jembatan; cocokkan titik penjemputan secara jelas dengan pengemudi lewat chat aplikasi Grab.',
    penandaA:
      'Dari Pintu Keluar Stasiun Gubeng Lama, melangkah ke jalur pejalan kaki di sisi kanan halaman stasiun dan menjauh dari area naik-turun kendaraan.',
    penandaB:
      'Susuri trotoar mengarah ke jembatan Gubeng. Perhatikan laju motor dan kendaraan yang keluar-masuk pelataran stasiun di sepanjang sisi trotoar.',
    penandaC:
      'Area Bawah Jembatan Gubeng (Simulasi) — berdiri di sisi trotoar dekat tiang jembatan yang mudah terlihat, lalu kirim patokan singkat kepada pengemudi Grab melalui chat aplikasi.',
    estimasiJalanKaki: DEFAULT_ESTIMATE_LABEL,
    statusVerifikasi: 'Simulasi',
    sumberInformasi: 'Tim Uji Purwarupa Jemput Jelas Gubeng (Data Simulasi Awal)',
    tanggalPemeriksaan: '2026-11-22',
  },
  {
    id: 'gubeng-lama-maxim',
    pintuKeluar: 'Pintu Keluar Stasiun Gubeng Lama',
    operator: 'Maxim',
    namaTitikTemu: 'Area Bawah Jembatan Gubeng (Simulasi)',
    pesanPeringatan:
      'Jangan berhenti di depan pintu keluar stasiun maupun di badan jalan. Pada skenario uji Maxim ini, titik temu diarahkan ke area bawah jembatan; pastikan Anda menyepakati patokan yang sama dengan pengemudi di chat aplikasi.',
    penandaA:
      'Keluar melalui Pintu Keluar Stasiun Gubeng Lama, segera menuju trotoar di tepi jalan dan hindari berdiri di jalur antrean kendaraan.',
    penandaB:
      'Berjalan mengikuti jalur trotoar menuju arah jembatan Gubeng. Jaga barang bawaan dan tetap gunakan bagian trotoar yang rata bagi pejalan kaki.',
    penandaC:
      'Area Bawah Jembatan Gubeng (Simulasi) — tunggu di sisi aman dekat area bawah jembatan yang tidak menghalangi lalu lintas, lalu konfirmasi posisi via chat aplikasi Maxim.',
    estimasiJalanKaki: DEFAULT_ESTIMATE_LABEL,
    statusVerifikasi: 'Simulasi',
    sumberInformasi: 'Tim Uji Purwarupa Jemput Jelas Gubeng (Data Simulasi Awal)',
    tanggalPemeriksaan: '2026-11-22',
  },
];
