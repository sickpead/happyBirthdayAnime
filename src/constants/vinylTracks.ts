import type { VinylTrack } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { ASSET_DIRECTORIES } from './assets';

/** Каталог дорожек из стопки пластинок внутри `public/`. */
export const VINYL_TRACK_DIRECTORY = `${ASSET_DIRECTORIES.audio}/vinyl`;

/**
 * Дорожки проигрывателя. Порядок в массиве — порядок в списке и обхода клавишей Tab.
 * Файлы лежат в `public/assets/audio/vinyl/`. Имена файлов кодируются в URL.
 */
export const VINYL_TRACKS: readonly VinylTrack[] = [
  {
    id: 'happy-birthday',
    title: 'С днём рождения',
    artist: 'Песня из вступления',
    src: assetUrl(`${ASSET_DIRECTORIES.audio}/happy-birthday.mp3`),
  },
  {
    id: 'abzal-uteshov-biz-zolygamyz',
    title: 'Abzal Uteshov Biz zolygamyz',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Abzal_Uteshov_Biz_zolygamyz.mp3`),
  },
  {
    id: 'adele-love-song',
    title: 'Love Song',
    artist: 'Adele',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Adele%20-%20Love%20Song.mp3`),
  },
  {
    id: 'arctic-monkeys-5o5',
    title: '5O5',
    artist: 'Arctic Monkeys',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Arctic%20Monkeys%20-%205O5.mp3`),
  },
  {
    id: 'arctic-monkeys-i-wanna-be-yours',
    title: 'I Wanna Be Yours',
    artist: 'Arctic Monkeys',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Arctic%20Monkeys%20-%20I%20Wanna%20Be%20Yours.mp3`),
  },
  {
    id: 'arctic-monkeys-snap-out-of-it',
    title: 'Snap Out Of It',
    artist: 'Arctic Monkeys',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Arctic%20Monkeys%20-%20Snap%20Out%20Of%20It.mp3`),
  },
  {
    id: 'arshat-unsiz',
    title: 'Unsiz',
    artist: 'ARShAT',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/ARShAT%20-%20Unsiz.mp3`),
  },
  {
    id: 'billie-eilish-wildflower',
    title: 'WILDFLOWER',
    artist: 'Billie Eilish',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Billie%20Eilish%20-%20WILDFLOWER.mp3`),
  },
  {
    id: 'blackbear-idfc',
    title: 'idfc',
    artist: 'blackbear',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/blackbear%20-%20idfc.mp3`),
  },
  {
    id: 'blackbear-feat-gucci-mane-do-re-mi',
    title: 'do re mi',
    artist: 'blackbear feat. Gucci Mane',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/blackbear%20feat.%20Gucci%20Mane%20-%20do%20re%20mi.mp3`,
    ),
  },
  {
    id: 'bo-a-duvet',
    title: 'Duvet',
    artist: 'bôa',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/b%C3%B4a%20-%20Duvet.mp3`),
  },
  {
    id: 'bonapart-merey-қозы-көрпеш-баян-сұлу',
    title: 'Қозы Көрпеш - Баян Сұлу',
    artist: 'Bonapart, MEREY',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Bonapart%2C%20MEREY%20-%20%D2%9A%D0%BE%D0%B7%D1%8B%20%D0%9A%D3%A9%D1%80%D0%BF%D0%B5%D1%88%20-%20%D0%91%D0%B0%D1%8F%D0%BD%20%D0%A1%D2%B1%D0%BB%D1%83.mp3`,
    ),
  },
  {
    id: 'da-ti-take-me-there',
    title: 'Take Me There',
    artist: 'DA TI',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/DA%20TI%20-%20Take%20Me%20There.mp3`),
  },
  {
    id: 'die-with-a-smile-lady-gaga-bruno-mars',
    title: 'Die With A Smile Lady Gaga, Bruno Mars',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Die_With_A_Smile_Lady_Gaga%2C_Bruno_Mars.mp3`),
  },
  {
    id: 'diplo-feat-trippie-redd-wish',
    title: 'Wish',
    artist: 'Diplo feat. Trippie Redd',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Diplo%20feat.%20Trippie%20Redd%20-%20Wish.mp3`),
  },
  {
    id: 'dosekesh-biraq',
    title: 'BIRAQ !',
    artist: 'Dosekesh',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Dosekesh%20-%20BIRAQ_!.mp3`),
  },
  {
    id: 'empire-of-the-sun-we-are-the-people',
    title: 'We Are The People',
    artist: 'Empire Of The Sun',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Empire%20Of%20The%20Sun%20-%20We%20Are%20The%20People.mp3`,
    ),
  },
  {
    id: 'ernazarov-rasul-болаи-ын-сен-үшін-acoustic',
    title: 'Болайын сен үшін (Acoustic)',
    artist: 'Ernazarov Rasul',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Ernazarov%20Rasul%20-%20%D0%91%D0%BE%D0%BB%D0%B0%D0%B9%D1%8B%D0%BD%20%D1%81%D0%B5%D0%BD%20%D2%AF%D1%88%D1%96%D0%BD%20(Acoustic).mp3`,
    ),
  },
  {
    id: 'gnash-feat-olivia-o-brien-i-hate-u-i-love-u-feat-olivia-',
    title: "i hate u, i love u (feat. olivia o'brien)",
    artist: "gnash feat. Olivia O'brien",
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/gnash%20feat.%20Olivia%20O'brien%20-%20i%20hate%20u%2C%20i%20love%20u%20(feat.%20olivia%20o'brien).mp3`,
    ),
  },
  {
    id: 'gracie-abrams-i-love-you-i-m-sorry',
    title: "I Love You, I'm Sorry",
    artist: 'Gracie Abrams',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Gracie%20Abrams%20-%20I%20Love%20You%2C%20I'm%20Sorry.mp3`,
    ),
  },
  {
    id: 'heaven-can-wait-originally-performed-by-michael-jackson',
    title: 'Heaven Can Wait (Originally Performed by Michael Jackson',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Heaven_Can_Wait_(Originally_Performed_by_Michael_Jackson.mp3`,
    ),
  },
  {
    id: 'joji-slow-dancing-in-the-dark',
    title: 'SLOW DANCING IN THE DARK',
    artist: 'Joji',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Joji%20-%20SLOW%20DANCING%20IN%20THE%20DARK.mp3`),
  },
  {
    id: 'kazybek-kuraiysh-senimenen',
    title: 'Kazybek Kuraiysh Senimenen',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Kazybek_Kuraiysh_Senimenen.mp3`),
  },
  {
    id: 'kenya-grace-strangers',
    title: 'Strangers',
    artist: 'Kenya Grace',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Kenya%20Grace%20-%20Strangers.mp3`),
  },
  {
    id: 'ma-meilleure-ennemie-from-the-series-arcane-league-of-le',
    title: 'Ma Meilleure Ennemie from the series Arcane League of Legends',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Ma_Meilleure_Ennemie_from_the_series_Arcane_League_of_Legends_.mp3`,
    ),
  },
  {
    id: 'machine-gun-kelly-x-ambassadors-bebe-rexha-home',
    title: 'Home',
    artist: 'Machine Gun Kelly, X Ambassadors, Bebe Rexha',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Machine%20Gun%20Kelly%2C%20X%20Ambassadors%2C%20Bebe%20Rexha%20-%20Home.mp3`,
    ),
  },
  {
    id: 'melanie-martinez-pacify-her',
    title: 'Pacify Her',
    artist: 'Melanie Martinez',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Melanie%20Martinez%20-%20Pacify%20Her.mp3`),
  },
  {
    id: 'metro-boomin-feat-the-weeknd-x-21-savage-creepin',
    title: 'Creepin',
    artist: 'Metro Boomin feat. The Weeknd x 21 Savage',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Metro%20Boomin%20feat.%20The%20Weeknd%20x%2021%20Savage%20-%20Creepin.mp3`,
    ),
  },
  {
    id: 'navai-больше-чем-ближе-vqmusic',
    title: 'Больше, чем ближе #vqMusic ོ',
    artist: 'NAVAI',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/NAVAI%20-%20%D0%91%D0%BE%D0%BB%D1%8C%D1%88%D0%B5%2C%20%D1%87%D0%B5%D0%BC%20%D0%B1%D0%BB%D0%B8%D0%B6%D0%B5%20_%20%23vqMusic%20%E0%BD%BC.mp3`,
    ),
  },
  {
    id: 'nirvana-smel-like-teen-spirit',
    title: 'Smel Like Teen Spirit',
    artist: 'Nirvana',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Nirvana%20-%20Smel%20Like%20Teen%20Spirit.mp3`),
  },
  {
    id: 'passenger-let-her-go',
    title: 'Let Her Go',
    artist: 'Passenger',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Passenger%20-%20Let%20Her%20Go.mp3`),
  },
  {
    id: 'ravyn-lenae-love-me-not',
    title: 'Love Me Not',
    artist: 'Ravyn Lenae',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Ravyn%20Lenae%20-%20Love%20Me%20Not.mp3`),
  },
  {
    id: 'sombr-back-to-friends',
    title: 'Back to friends',
    artist: 'Sombr',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Sombr%20-%20Back%20to%20friends.mp3`),
  },
  {
    id: 'sombr-we-never-dated',
    title: 'We never dated',
    artist: 'Sombr',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Sombr%20-%20We%20never%20dated.mp3`),
  },
  {
    id: 'suki-waterhouse-good-looking',
    title: 'Good Looking',
    artist: 'Suki Waterhouse',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Suki%20Waterhouse%20-%20Good%20Looking.mp3`),
  },
  {
    id: 'sydney-rose-we-hug-now-muzep-net',
    title: 'We Hug Now',
    artist: 'Sydney Rose',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Sydney%20Rose%20-%20We%20Hug%20Now%20(Muzep.net).mp3`),
  },
  {
    id: 'temper-city-self-aware',
    title: 'Self Aware',
    artist: 'Temper City',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/Temper%20City%20-%20Self%20Aware.mp3`),
  },
  {
    id: 'the-neighbourhood-leaving-tonight-nightcorebot',
    title: 'leaving tonight',
    artist: 'the neighbourhood',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/the%20neighbourhood%20-%20leaving%20tonight%20%5B_nightcorebot%5D.mp3`,
    ),
  },
  {
    id: 'the-neighbourhood-sweater-weather',
    title: 'Sweater Weather',
    artist: 'The Neighbourhood',
    src: assetUrl(`${VINYL_TRACK_DIRECTORY}/The%20Neighbourhood%20-%20Sweater%20Weather.mp3`),
  },
  {
    id: 'the-smiths-back-to-the-old-house-2011-remaster',
    title: 'Back to the Old House (2011 Remaster)',
    artist: 'The Smiths',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/The%20Smiths%20-%20Back%20to%20the%20Old%20House%20(2011%20Remaster).mp3`,
    ),
  },
  {
    id: 'toni-mот-просто-сложно-2023',
    title: 'Просто-сложно (2023)',
    artist: 'Toni, Mот',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/Toni%2C%20M%D0%BE%D1%82%20-%20%D0%9F%D1%80%D0%BE%D1%81%D1%82%D0%BE-%D1%81%D0%BB%D0%BE%D0%B6%D0%BD%D0%BE%20(2023).mp3`,
    ),
  },
  {
    id: 'батырхан-шукенов-джулия',
    title: 'Джулия',
    artist: 'Батырхан Шукенов',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/%D0%91%D0%B0%D1%82%D1%8B%D1%80%D1%85%D0%B0%D0%BD%20%D0%A8%D1%83%D0%BA%D0%B5%D0%BD%D0%BE%D0%B2%20-%20%D0%94%D0%B6%D1%83%D0%BB%D0%B8%D1%8F.mp3`,
    ),
  },
  {
    id: 'батырхан-шукенов-дождь',
    title: 'Дождь',
    artist: 'Батырхан Шукенов',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/%D0%91%D0%B0%D1%82%D1%8B%D1%80%D1%85%D0%B0%D0%BD%20%D0%A8%D1%83%D0%BA%D0%B5%D0%BD%D0%BE%D0%B2%20-%20%D0%94%D0%BE%D0%B6%D0%B4%D1%8C.mp3`,
    ),
  },
  {
    id: 'дос-мұқасан-сағындым-сені',
    title: 'Сағындым сені',
    artist: 'Дос-Мұқасан',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/%D0%94%D0%BE%D1%81-%D0%9C%D2%B1%D2%9B%D0%B0%D1%81%D0%B0%D0%BD%20-%20%D0%A1%D0%B0%D2%93%D1%8B%D0%BD%D0%B4%D1%8B%D0%BC%20%D1%81%D0%B5%D0%BD%D1%96.mp3`,
    ),
  },
  {
    id: 'скриптонит-кпсп',
    title: 'КПСП',
    artist: 'Скриптонит',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/%D0%A1%D0%BA%D1%80%D0%B8%D0%BF%D1%82%D0%BE%D0%BD%D0%B8%D1%82%20-%20%D0%9A%D0%9F%D0%A1%D0%9F.mp3`,
    ),
  },
  {
    id: 'ost-хватаи-сон-джэ-и-беги',
    title: '소나기',
    artist: '이클립스',
    src: assetUrl(
      `${VINYL_TRACK_DIRECTORY}/%EC%9D%B4%ED%81%B4%EB%A6%BD%EC%8A%A4%20-%20%EC%86%8C%EB%82%98%EA%B8%B0%20%5BOST%20%D0%A5%D0%B2%D0%B0%D1%82%D0%B0%D0%B9%20%D0%A1%D0%BE%D0%BD%20%D0%94%D0%B6%D1%8D%20%D0%B8%20%D0%B1%D0%B5%D0%B3%D0%B8%5D.mp3`,
    ),
  },
];
