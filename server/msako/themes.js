// Word lists for Msako wa Maneno. One theme a day; the generator picks 7-10 words from the theme.
// Rules: A-Z only, 3-8 letters (the grid is 8×8). Words inside other words (PIANO in AMAPIANO) are fine:
// the generator never uses both on the same day.
export const THEMES = [
  { sw: 'Menyu ya Kahawa', en: 'Café menu', words: ['LATTE', 'MOCHA', 'ESPRESSO', 'CHAI', 'MANDAZI', 'SAMOSA', 'MUFFIN', 'JUICE', 'CAKE', 'COOKIE', 'SCONE', 'BROWNIE', 'CORTADO', 'FRAPPE'] },
  { sw: 'Matunda', en: 'Fruits', words: ['MANGO', 'PAPAYA', 'BANANA', 'PASSION', 'GUAVA', 'LIME', 'ORANGE', 'AVOCADO', 'COCONUT', 'LEMON', 'MELON', 'TAMARIND', 'DATES'] },
  { sw: 'Wanyama', en: 'Animals in Kiswahili', words: ['SIMBA', 'TEMBO', 'TWIGA', 'KIBOKO', 'PUNDA', 'NYATI', 'CHUI', 'FISI', 'NYANI', 'KIFARU', 'DUMA', 'SWALA', 'NYOKA', 'KOBE'] },
  { sw: 'Safari', en: 'Wild animals', words: ['LION', 'ZEBRA', 'GIRAFFE', 'HIPPO', 'RHINO', 'CHEETAH', 'LEOPARD', 'BUFFALO', 'HYENA', 'ELEPHANT', 'GAZELLE', 'WARTHOG', 'IMPALA'] },
  { sw: 'Pwani', en: 'At the beach', words: ['OCEAN', 'DHOW', 'CORAL', 'SHELL', 'WAVE', 'SAND', 'TIDE', 'REEF', 'CRAB', 'BEACH', 'ISLAND', 'SEAWEED', 'DOLPHIN', 'LAGOON'] },
  { sw: 'Viungo vya Zanzibar', en: 'Spices', words: ['CLOVE', 'CINNAMON', 'NUTMEG', 'PEPPER', 'GINGER', 'CARDAMOM', 'VANILLA', 'TURMERIC', 'CUMIN', 'CHILLI', 'SAFFRON', 'PAPRIKA', 'GARLIC'] },
  { sw: 'Mitaa ya Dar', en: 'Dar neighbourhoods', words: ['KARIAKOO', 'MSASANI', 'MBEZI', 'UPANGA', 'MASAKI', 'ILALA', 'TEMEKE', 'UBUNGO', 'SINZA', 'KAWE', 'MAGOMENI', 'TEGETA', 'BUGURUNI'] },
  { sw: 'Mpira wa Miguu', en: 'Football', words: ['GOAL', 'STRIKER', 'KEEPER', 'PENALTY', 'CORNER', 'DERBY', 'REFEREE', 'OFFSIDE', 'TACKLE', 'HEADER', 'PITCH', 'WHISTLE', 'CAPTAIN'] },
  { sw: 'Muziki', en: 'Music', words: ['BONGO', 'TAARAB', 'SINGELI', 'AMAPIANO', 'DRUM', 'GUITAR', 'RHYTHM', 'CHORUS', 'MELODY', 'PIANO', 'BASS', 'VOICE', 'DANCE', 'TEMPO'] },
  { sw: 'Rangi', en: 'Colours', words: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'BLACK', 'WHITE', 'PINK', 'BROWN', 'GOLD', 'SILVER', 'MAROON', 'VIOLET'] },
  { sw: 'Kifungua Kinywa', en: 'Breakfast', words: ['EGGS', 'TOAST', 'BEANS', 'CHAPATI', 'UJI', 'HONEY', 'BUTTER', 'OMELETTE', 'SAUSAGE', 'PANCAKE', 'BACON', 'CEREAL', 'YOGHURT'] },
  { sw: 'Usafiri', en: 'Getting around', words: ['BODA', 'BAJAJI', 'DALADALA', 'FERRY', 'TRAIN', 'BICYCLE', 'TAXI', 'BUS', 'SCOOTER', 'TRUCK', 'CANOE', 'PLANE'] },
  { sw: 'Vifaa vya Barista', en: "Barista's kit", words: ['KETTLE', 'GRINDER', 'FILTER', 'MUG', 'SAUCER', 'SPOON', 'TRAY', 'CUP', 'JUG', 'TAMPER', 'BEANS', 'MILK', 'STEAMER', 'SCALE'] },
  { sw: 'Hali ya Hewa', en: 'Weather', words: ['RAIN', 'SUNNY', 'CLOUD', 'STORM', 'BREEZE', 'THUNDER', 'HUMID', 'MIST', 'WIND', 'RAINBOW', 'HEAT', 'FOG', 'DRIZZLE'] },
  { sw: 'Familia', en: 'Family in Kiswahili', words: ['MAMA', 'BABA', 'BIBI', 'BABU', 'DADA', 'KAKA', 'MJOMBA', 'SHANGAZI', 'BINAMU', 'MTOTO', 'MKE', 'MUME', 'SHEMEJI'] },
  { sw: 'Mwili', en: 'The body in Kiswahili', words: ['KICHWA', 'MKONO', 'MGUU', 'JICHO', 'SIKIO', 'PUA', 'MDOMO', 'MOYO', 'TUMBO', 'KIDOLE', 'NYWELE', 'BEGA', 'GOTI'] },
];

// The letters no theme word uses spell one of these, read left to right, top to bottom.
export const PHRASES = [
  'POLE POLE', 'MAMBO POA', 'MOTO MOTO', 'SIKU NJEMA', 'KAZI NZURI', 'KARIBU TENA', 'ASANTE SANA', 'KAHAWA TAMU',
  'CHAI YA MOTO', 'LALA SALAMA', 'HAPA KAZI TU', 'TUNYWE CHAI', 'FURAHA TELE', 'KARIBU SANA', 'KILA LA HERI',
  'HABARI GANI', 'USIKU MWEMA', 'SAFARI NJEMA', 'JAMBO RAFIKI', 'AKILI NI MALI', 'HONGERA SANA', 'MCHANA MWEMA',
  'PENDA KAHAWA', 'BAHATI NJEMA', 'HAKUNA MATATA', 'TUONANE KESHO', 'KARIBU KAHAWA', 'KAHAWA YA ENZI', 'SHUKRANI SANA',
  'CHAI NA MANDAZI', 'ASANTE KWA KUJA', 'MAISHA NI SAFARI', 'PAMOJA TUNAWEZA', 'HABARI ZA ASUBUHI', 'SIKU NJEMA RAFIKI',
  'KAHAWA NA MANDAZI', 'KARIBU TENA RAFIKI',
];
