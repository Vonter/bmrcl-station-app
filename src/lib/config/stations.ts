export type StationId = 'mgroad' | string; // Extensible for future stations

export interface StationConfig {
	floors: string[];
	bounds: [[number, number], [number, number], [number, number], [number, number]];
	coordinates: [number, number];
}

export const STATION_CONFIGS: Record<StationId, StationConfig> = {
	apts: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.52905, 12.86104], // Top left [lng, lat]
			[77.52983, 12.86238], // Top right
			[77.53051, 12.862], // Bottom right
			[77.52973, 12.86067] // Bottom left
		]
	},
	tgtp: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.53916, 12.87173], // Top left [lng, lat]
			[77.53817, 12.87052], // Top right
			[77.53754, 12.87101], // Bottom right
			[77.53854, 12.87222] // Bottom left
		]
	},
	vjrh: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.54542, 12.87804], // Top left [lng, lat]
			[77.5448, 12.87665], // Top right
			[77.54409, 12.87693], // Bottom right
			[77.5447, 12.87833] // Bottom left
		]
	},
	klpk: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.55366, 12.8845], // Top left [lng, lat]
			[77.55211, 12.88403], // Top right
			[77.55187, 12.88479], // Bottom right
			[77.55342, 12.88526] // Bottom left
		]
	},
	aprc: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.56357, 12.88919], // Top left [lng, lat]
			[77.56241, 12.88817], // Top right
			[77.56189, 12.88874], // Bottom right
			[77.56305, 12.88976] // Bottom left
		]
	},
	puth: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.56937, 12.89562], // Top left [lng, lat]
			[77.5704, 12.89679], // Top right
			[77.571, 12.89628], // Bottom right
			[77.56997, 12.89512] // Bottom left
		]
	},
	jpn: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.57286, 12.90661], // Top left [lng, lat]
			[77.57268, 12.90818], // Top right
			[77.57349, 12.90826], // Bottom right
			[77.57369, 12.9067] // Bottom left
		]
	},
	bsnk: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.57425, 12.91656], // Top left [lng, lat]
			[77.57383, 12.91377], // Top right
			[77.57276, 12.91393], // Bottom right
			[77.57317, 12.91671] // Bottom left
		]
	},
	jyn: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.58049, 12.93013], // Top left [lng, lat]
			[77.58049, 12.92883], // Top right
			[77.57983, 12.92883], // Bottom right
			[77.57983, 12.93013] // Bottom left
		]
	},
	sece: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.57959, 12.93711], // Top left [lng, lat]
			[77.57959, 12.93908], // Top right
			[77.58059, 12.93908], // Bottom right
			[77.5806, 12.93711] // Bottom left
		]
	},
	lbgh: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.57964, 12.94559], // Top left [lng, lat]
			[77.57964, 12.94697], // Top right
			[77.58035, 12.94697], // Bottom right
			[77.58035, 12.94559] // Bottom left
		]
	},
	nlc: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.57336, 12.94974], // Top left [lng, lat]
			[77.57336, 12.95117], // Top right
			[77.57409, 12.95117], // Bottom right
			[77.57409, 12.94974] // Bottom left
		]
	},
	krmt: {
		floors: ['Ground', 'Concourse', 'Platform'],
		bounds: [
			[77.57602, 12.96218], // Top left [lng, lat]
			[77.57541, 12.95903], // Top right
			[77.57358, 12.95936], // Bottom right
			[77.5742, 12.96252] // Bottom left
		]
	},
	spru: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.56246, 12.99715], // Top left [lng, lat]
			[77.56442, 12.99687], // Top right
			[77.56426, 12.9958], // Bottom right
			[77.56229, 12.99609] // Bottom left
		]
	},
	kvpr: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.55639, 12.99901], // Top left [lng, lat]
			[77.55789, 12.99871], // Top right
			[77.55773, 12.99789], // Bottom right
			[77.55623, 12.99818] // Bottom left
		]
	},
	rjnr: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.5502, 13.00154], // Top left [lng, lat]
			[77.55058, 12.99927], // Top right
			[77.54927, 12.99907], // Bottom right
			[77.54889, 13.00133] // Bottom left
		]
	},
	mhli: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.54949, 13.00919], // Top left [lng, lat]
			[77.5492, 13.00746], // Top right
			[77.54819, 13.00762], // Bottom right
			[77.54848, 13.00936] // Bottom left
		]
	},
	ssfy: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.55343, 13.01351], // Top left [lng, lat]
			[77.55334, 13.01552], // Top right
			[77.55449, 13.01556], // Bottom right
			[77.55458, 13.01356] // Bottom left
		]
	},
	ypm: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.55034, 13.02254], // Top left [lng, lat]
			[77.54894, 13.02332], // Top right
			[77.5494, 13.0241], // Bottom right
			[77.55079, 13.02333] // Bottom left
		]
	},
	ypi: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.54057, 13.02889], // Top left [lng, lat]
			[77.54149, 13.02836], // Top right
			[77.54116, 13.02781], // Bottom right
			[77.54024, 13.02834] // Bottom left
		]
	},
	peya: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.53281, 13.03416], // Top left [lng, lat]
			[77.53506, 13.03285], // Top right
			[77.53431, 13.03159], // Bottom right
			[77.53205, 13.03292] // Bottom left
		]
	},
	pyid: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.52499, 13.03732], // Top left [lng, lat]
			[77.5266, 13.03646], // Top right
			[77.52611, 13.03559], // Bottom right
			[77.5245, 13.03644] // Bottom left
		]
	},
	jlhl: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.51924, 13.04047], // Top left [lng, lat]
			[77.52136, 13.03931], // Top right
			[77.52068, 13.03814], // Bottom right
			[77.51856, 13.03931] // Bottom left
		]
	},
	dsh: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.5115, 13.04449], // Top left [lng, lat]
			[77.51405, 13.04366], // Top right
			[77.51358, 13.04225], // Bottom right
			[77.51101, 13.04309] // Bottom left
		]
	},
	ngsa: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.49932, 13.04906], // Top left [lng, lat]
			[77.50165, 13.04821], // Top right
			[77.50114, 13.04693], // Bottom right
			[77.49882, 13.04779] // Bottom left
		]
	},
	mnjn: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.49335, 13.05117], // Top left [lng, lat]
			[77.49553, 13.0504], // Top right
			[77.49508, 13.04921], // Bottom right
			[77.49292, 13.04998] // Bottom left
		]
	},
	jidl: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.48688, 13.0535], // Top left [lng, lat]
			[77.48898, 13.05271], // Top right
			[77.48853, 13.05155], // Bottom right
			[77.48642, 13.05235] // Bottom left
		]
	},
	biet: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.47213, 13.05812], // Top left [lng, lat]
			[77.47393, 13.05769], // Top right
			[77.47368, 13.0567], // Bottom right
			[77.47187, 13.05713] // Bottom left
		]
	},

	whtm: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.75733, 12.99484], // Top left [lng, lat]
			[77.75773, 12.99624], // Top right
			[77.75844, 12.99605], // Bottom right
			[77.75805, 12.99466] // Bottom left
		]
	},
	uwvl: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.75315, 12.98667], // Top left [lng, lat]
			[77.75381, 12.98812], // Top right
			[77.75455, 12.98782], // Bottom right
			[77.75392, 12.98638] // Bottom left
		]
	},
	kdgd: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.74636, 12.98633], // Top left [lng, lat]
			[77.74784, 12.98576], // Top right
			[77.74755, 12.98503], // Bottom right
			[77.74606, 12.9856] // Bottom left
		]
	},
	itpl: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.73705, 12.988], // Top left [lng, lat]
			[77.73866, 12.988], // Top right
			[77.73866, 12.98721], // Bottom right
			[77.73704, 12.98721] // Bottom left
		]
	},
	sshp: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.72703, 12.98049], // Top left [lng, lat]
			[77.72737, 12.98203], // Top right
			[77.72816, 12.98187], // Bottom right
			[77.72783, 12.98033] // Bottom left
		]
	},
	vdhp: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.72407, 12.97708], // Top left [lng, lat]
			[77.72555, 12.97694], // Top right
			[77.72548, 12.97622], // Bottom right
			[77.72401, 12.97635] // Bottom left
		]
	},
	kdnh: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.71489, 12.97807], // Top left [lng, lat]
			[77.71649, 12.97785], // Top right
			[77.71638, 12.97706], // Bottom right
			[77.71478, 12.97729] // Bottom left
		]
	},
	vwia: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.70896, 12.98172], // Top left [lng, lat]
			[77.70938, 12.98025], // Top right
			[77.70863, 12.98006], // Bottom right
			[77.70821, 12.98152] // Bottom left
		]
	},
	dkia: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.71222, 12.9889], // Top left [lng, lat]
			[77.7109, 12.98814], // Top right
			[77.7105, 12.98879], // Bottom right
			[77.71182, 12.98954] // Bottom left
		]
	},
	gdcp: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.7031, 12.994], // Top left [lng, lat]
			[77.70462, 12.99359], // Top right
			[77.70441, 12.99284], // Bottom right
			[77.70288, 12.99325] // Bottom left
		]
	},
	mdvp: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.69208, 12.99716], // Top left [lng, lat]
			[77.69354, 12.99667], // Top right
			[77.69329, 12.99596], // Bottom right
			[77.69183, 12.99645] // Bottom left
		]
	},
	kram: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.67882, 12.99964], // Top left [lng, lat]
			[77.67672, 12.99955], // Top right
			[77.67668, 13.00032], // Bottom right
			[77.67879, 13.00042] // Bottom left
		]
	},
	jtpm: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.66753, 12.99645], // Top left [lng, lat]
			[77.66915, 12.99716], // Top right
			[77.66943, 12.99657], // Bottom right
			[77.6678, 12.99584] // Bottom left
		]
	},
	byph: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.65112, 12.99101], // Top left [lng, lat]
			[77.65331, 12.99154], // Top right
			[77.65367, 12.99049], // Bottom right
			[77.65142, 12.98992] // Bottom left
		]
	},
	svrd: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.64389, 12.98585], // Top left [lng, lat]
			[77.64544, 12.98646], // Top right
			[77.64575, 12.9857], // Bottom right
			[77.6442, 12.98509] // Bottom left
		]
	},
	idn: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.63795, 12.97857], // Top left [lng, lat]
			[77.63926, 12.97859], // Top right
			[77.63928, 12.97795], // Bottom right
			[77.63796, 12.97792] // Bottom left
		]
	},
	hlru: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.62591, 12.97627], // Top left [lng, lat]
			[77.6268, 12.97751], // Top right
			[77.62743, 12.97707], // Bottom right
			[77.62655, 12.97583] // Bottom left
		]
	},
	tty: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.61637, 12.97343], // Top left [lng, lat]
			[77.61766, 12.97315], // Top right
			[77.61752, 12.97252], // Bottom right
			[77.61622, 12.9728] // Bottom left
		]
	},
	magr: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.60581, 12.97614], // Top left [lng, lat]
			[77.60811, 12.97558], // Top right
			[77.60783, 12.97444], // Bottom right
			[77.60552, 12.97501] // Bottom left
		]
	},
	cbpk: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.59799, 12.9803], // Top left [lng, lat]
			[77.596, 12.98096], // Top right
			[77.59633, 12.98193], // Bottom right
			[77.59831, 12.98127] // Bottom left
		]
	},
	vdsa: {
		floors: ['Ground', 'Concourse', 'Platform'],
		bounds: [
			[77.58973, 12.97736], // Top left [lng, lat]
			[77.5926, 12.98093], // Top right
			[77.59351, 12.98023], // Bottom right
			[77.59065, 12.97666] // Bottom left
		]
	},
	vswa: {
		floors: ['Ground', 'Concourse', 'Platform'],
		bounds: [
			[77.58564, 12.97473], // Top left [lng, lat]
			[77.5824, 12.97285], // Top right
			[77.58193, 12.97364], // Bottom right
			[77.58508, 12.97551] // Bottom left
		]
	},
	kgwa: {
		floors: ['Concourse', 'Purple', 'Green'],
		bounds: [
			[77.57118, 12.97724], // Top left [lng, lat]
			[77.5743, 12.97724], // Top right
			[77.57431, 12.97382], // Bottom right
			[77.57119, 12.97381] // Bottom left
		]
	},
	brcs: {
		floors: ['Ground', 'Concourse', 'Platform'],
		bounds: [
			[77.56789, 12.9754], // Top left [lng, lat]
			[77.56388, 12.97516], // Top right
			[77.56381, 12.97615], // Bottom right
			[77.56792, 12.97638] // Bottom left
		]
	},
	myrd: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.53111, 12.94635], // Top left [lng, lat]
			[77.52947, 12.94562], // Top right
			[77.5291, 12.94643], // Bottom right
			[77.53075, 12.94715] // Bottom left
		]
	},
	nyhm: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.52431, 12.94119], // Top left [lng, lat]
			[77.52519, 12.94256], // Top right
			[77.52589, 12.94213], // Bottom right
			[77.52501, 12.94075] // Bottom left
		]
	},
	rrrn: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.52058, 12.93656], // Top left [lng, lat]
			[77.51901, 12.93598], // Top right
			[77.51871, 12.93674], // Bottom right
			[77.52027, 12.93733] // Bottom left
		]
	},
	bguc: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.51298, 12.93525], // Top left [lng, lat]
			[77.51166, 12.93479], // Top right
			[77.51143, 12.93544], // Bottom right
			[77.51275, 12.93589] // Bottom left
		]
	},
	patg: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.4991, 12.92451], // Top left [lng, lat]
			[77.498, 12.92346], // Top right
			[77.49747, 12.924], // Bottom right
			[77.49857, 12.92505] // Bottom left
		]
	},
	mlsd: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.48704, 12.91455], // Top left [lng, lat]
			[77.48806, 12.91531], // Top right
			[77.48845, 12.91482], // Bottom right
			[77.48744, 12.91405] // Bottom left
		]
	},
	kgit: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.47736, 12.908], // Top left [lng, lat]
			[77.47598, 12.90711], // Top right
			[77.47552, 12.90779], // Bottom right
			[77.4769, 12.90868] // Bottom left
		]
	},
	clgd: {
		floors: ['Platform', 'Concourse', 'Ground'],
		bounds: [
			[77.46231, 12.8977], // Top left [lng, lat]
			[77.46101, 12.89656], // Top right
			[77.46042, 12.89719], // Bottom right
			[77.46172, 12.89834] // Bottom left
		]
	}
} as const;

export interface Station {
	name: string;
	coordinates: [number, number];
	color: 'purple' | 'green' | 'interchange';
	code: string;
}

export const stations: Station[] = [
	{ name: 'Madavara', color: 'green', coordinates: [77.4728055, 13.0574214], code: 'BIET' },
	{
		name: 'Chikkabidarakallu',
		color: 'green',
		coordinates: [77.4879154, 13.0523616],
		code: 'JIDL'
	},
	{ name: 'Manjunathanagara', color: 'green', coordinates: [77.4944461, 13.0500898], code: 'MNJN' },
	{ name: 'Nagasandra', color: 'green', coordinates: [77.5001422, 13.0479536], code: 'NGSA' },
	{ name: 'Dasarahalli', color: 'green', coordinates: [77.5125535, 13.0432607], code: 'DSH' },
	{ name: 'Jalahalli', color: 'green', coordinates: [77.5197351, 13.0394104], code: 'JLHL' },
	{ name: 'Peenya Industry', color: 'green', coordinates: [77.5254924, 13.0363176], code: 'PYID' },
	{ name: 'Peenya', color: 'green', coordinates: [77.533201, 13.0330189], code: 'PEYA' },
	{
		name: 'Goraguntepalya',
		color: 'green',
		coordinates: [77.5408492610245, 13.0283813742511],
		code: 'YPI'
	},
	{ name: 'Yeshwantpur', color: 'green', coordinates: [77.5498751, 13.0232678], code: 'YPM' },
	{
		name: 'Sandal Soap Factory',
		color: 'green',
		coordinates: [77.5539839, 13.0146544],
		code: 'SSFY'
	},
	{ name: 'Mahalakshmi', color: 'green', coordinates: [77.5488066, 13.0080475], code: 'MHLI' },
	{ name: 'Rajajinagar', color: 'green', coordinates: [77.5496568, 13.0005247], code: 'RJNR' },
	{
		name: 'Mahakavi Kuvempu Road',
		color: 'green',
		coordinates: [77.5568986, 12.9985297],
		code: 'KVPR'
	},
	{ name: 'Srirampura', color: 'green', coordinates: [77.5631963, 12.9965253], code: 'SPRU' },
	{
		name: 'Mantri Square Sampige Road',
		color: 'green',
		coordinates: [77.5707293, 12.9904629],
		code: 'SPGD'
	},
	{
		name: 'Nadaprabhu Kempegowda Station, Majestic',
		color: 'green',
		coordinates: [77.5728757, 12.9757079],
		code: 'KGWA'
	},
	{ name: 'Chickpete', color: 'green', coordinates: [77.5745566, 12.9668974], code: 'CKPE' },
	{
		name: 'Krishna Rajendra Market',
		color: 'green',
		coordinates: [77.5746578, 12.9608788],
		code: 'KRMT'
	},
	{ name: 'National College', color: 'green', coordinates: [77.5736898, 12.9505266], code: 'NLC' },
	{ name: 'Lalbagh', color: 'green', coordinates: [77.580016, 12.9465265], code: 'LBGH' },
	{ name: 'South End Circle', color: 'green', coordinates: [77.5800556, 12.9382573], code: 'SECE' },
	{ name: 'Jayanagar', color: 'green', coordinates: [77.5801439, 12.9295069], code: 'JYN' },
	{
		name: 'Rashtreeya Vidyalaya Road',
		color: 'green',
		coordinates: [77.5802659, 12.921331],
		code: 'RVR'
	},
	{ name: 'Banashankari', color: 'green', coordinates: [77.573598, 12.9152208], code: 'BSNK' },
	{
		name: 'Jaya Prakash Nagar',
		color: 'green',
		coordinates: [77.5731279, 12.9074747],
		code: 'JPN'
	},
	{ name: 'Yelachenahalli', color: 'green', coordinates: [77.5701194, 12.8960498], code: 'PUTH' },
	{
		name: 'Konanakunte Cross',
		color: 'green',
		coordinates: [77.5626665, 12.8889671],
		code: 'APRC'
	},
	{ name: 'Doddakallasandra', color: 'green', coordinates: [77.5527546, 12.8846435], code: 'KLPK' },
	{ name: 'Vajarahalli', color: 'green', coordinates: [77.5447414, 12.8774369], code: 'VJRH' },
	{ name: 'Thalaghattapura', color: 'green', coordinates: [77.5383958, 12.8714097], code: 'TGTP' },
	{ name: 'Silk Institute', color: 'green', coordinates: [77.5299545, 12.8617298], code: 'APTS' },

	{
		name: 'Whitefield (Kadugodi)',
		color: 'purple',
		coordinates: [77.7579489, 12.9957428],
		code: 'WHTM'
	},
	{
		name: 'Hopefarm Channasandra',
		color: 'purple',
		coordinates: [77.7538033, 12.9873426],
		code: 'UWVL'
	},
	{
		name: 'Kadugodi Tree Park',
		color: 'purple',
		coordinates: [77.7470121, 12.9856503],
		code: 'KDGD'
	},
	{
		name: 'Pattandur Agrahara',
		color: 'purple',
		coordinates: [77.7377718, 12.9876393],
		code: 'ITPL'
	},
	{
		name: 'Sri Sathya Sai Hospital',
		color: 'purple',
		coordinates: [77.7275361, 12.9811949],
		code: 'SSHP'
	},
	{ name: 'Nallurahalli', color: 'purple', coordinates: [77.7248845, 12.9766408], code: 'VDHP' },
	{ name: 'Kundalahalli', color: 'purple', coordinates: [77.7155586, 12.977594], code: 'KDNH' },
	{ name: 'Seetharampalya', color: 'purple', coordinates: [77.7087854, 12.9808558], code: 'VWIA' },
	{ name: 'Hoodi', color: 'purple', coordinates: [77.711326, 12.9888029], code: 'DKIA' },
	{ name: 'Garudacharpalya', color: 'purple', coordinates: [77.7036768, 12.9934505], code: 'GDCP' },
	{ name: 'Singayyanapalya', color: 'purple', coordinates: [77.6927176, 12.9965445], code: 'MDVP' },
	{ name: 'Krishnarajapura', color: 'purple', coordinates: [77.6776703, 12.9999024], code: 'KRAM' },
	{ name: 'Benniganahalli', color: 'purple', coordinates: [77.6684619, 12.9965158], code: 'JTPM' },
	{ name: 'Baiyappanahalli', color: 'purple', coordinates: [77.6523612, 12.9907594], code: 'BYPH' },
	{
		name: 'Swami Vivekananda Road',
		color: 'purple',
		coordinates: [77.644897, 12.9859306],
		code: 'SVRD'
	},
	{ name: 'Indiranagar', color: 'purple', coordinates: [77.6386612, 12.9783325], code: 'IDN' },
	{ name: 'Halasuru', color: 'purple', coordinates: [77.626686, 12.9764992], code: 'HLRU' },
	{ name: 'Trinity', color: 'purple', coordinates: [77.6170205, 12.9730218], code: 'TTY' },
	{
		name: 'Mahatma Gandhi Road',
		color: 'purple',
		coordinates: [77.6067902, 12.9755264],
		code: 'MAGR'
	},
	{ name: 'Cubbon Park', color: 'purple', coordinates: [77.5975756, 12.9809575], code: 'CBPK' },
	{
		name: 'Dr. B. R. Ambedkar Station, Vidhana Soudha',
		color: 'purple',
		coordinates: [77.5916385, 12.9787419],
		code: 'VDSA'
	},
	{
		name: 'Sir M. Visvesvaraya Stn., Central College',
		color: 'purple',
		coordinates: [77.58422, 12.9745197],
		code: 'VSWA'
	},
	{
		name: 'Nadaprabhu Kempegowda Station, Majestic',
		color: 'purple',
		coordinates: [77.5728757, 12.9757079],
		code: 'KGWA'
	},
	{
		name: 'Krantivira Sangolli Rayanna Railway Station',
		color: 'purple',
		coordinates: [77.5653767, 12.9758768],
		code: 'BRCS'
	},
	{ name: 'Magadi Road', color: 'purple', coordinates: [77.5553523, 12.975632], code: 'MIRD' },
	{
		name: 'Sri Balagangadharanatha Swamiji Station, Hosahalli',
		color: 'purple',
		coordinates: [77.5456215, 12.9742933],
		code: 'HSLI'
	},
	{ name: 'Vijayanagar', color: 'purple', coordinates: [77.5374044, 12.9709559], code: 'VJN' },
	{ name: 'Attiguppe', color: 'purple', coordinates: [77.5335788, 12.9618931], code: 'AGPP' },
	{
		name: 'Deepanjali Nagar',
		color: 'purple',
		coordinates: [77.5370122, 12.9520578],
		code: 'DJNR'
	},
	{ name: 'Mysore Road', color: 'purple', coordinates: [77.5301588, 12.9467183], code: 'MYRD' },
	{
		name: 'Pantharapalya - Nayandahalli',
		color: 'purple',
		coordinates: [77.5251166, 12.9416715],
		code: 'NYHM'
	},
	{
		name: 'Rajarajeshwari Nagar',
		color: 'purple',
		coordinates: [77.5196788, 12.9365996],
		code: 'RRRN'
	},
	{ name: 'Jnanabharathi', color: 'purple', coordinates: [77.5124063, 12.9354357], code: 'BGUC' },
	{ name: 'Pattanagere', color: 'purple', coordinates: [77.4983509, 12.9242505], code: 'PATG' },
	{
		name: 'Kengeri Bus Terminal',
		color: 'purple',
		coordinates: [77.4878557, 12.914689],
		code: 'MLSD'
	},
	{ name: 'Kengeri', color: 'purple', coordinates: [77.4765784, 12.9079105], code: 'KGIT' },
	{ name: 'Challaghatta', color: 'purple', coordinates: [77.4612877, 12.8973539], code: 'CLGD' }
];
