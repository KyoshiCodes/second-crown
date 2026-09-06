export interface RealmFlavor {
  realmId: string;
  realmName: string;
  rulerName: string;
  title: string;
  blurb: string;
  warTaunt: string;
  giftThanks: string;
  chargeName: string;
}

export const REALM_FLAVOR: Record<string, RealmFlavor> = {
  player: {
    realmId: "player",
    realmName: "Your Crown",
    rulerName: "The Exiled King",
    title: "The Restorer",
    blurb: "Cast out from your ancestral throne with only loyal retainers and a faded map, your banner rises once more from the ashes.",
    warTaunt: "By blood and birthright, our ancestral realm shall be reclaimed.",
    giftThanks: "Tribute well rendered to the rightful crown.",
    chargeName: "Imperial Solar Crown",
  },
  rival: {
    realmId: "rival",
    realmName: "Iron March",
    rulerName: "Lord Varric",
    title: "Iron Warmaster",
    blurb: "A grim martial juggernaut marching from soot-choked foundries. Lord Varric commands iron-clad cohorts who know neither parley nor retreat.",
    warTaunt: "Kneel and yield your crown, or be crushed under iron boots!",
    giftThanks: "Gold? A sensible down-payment on your survival, exile.",
    chargeName: "Crossed Greatswords & Iron Keep",
  },
  k_silk: {
    realmId: "k_silk",
    realmName: "Silk Coast",
    rulerName: "Sera Valin",
    title: "High Factor of the Grand Exchange",
    blurb: "Gilded harbor-cities where caravels drop anchor laden with spices and damask. Sera Valin counts treaties in ledgers of profit.",
    warTaunt: "Your insolence cost us gold, and that is a capital crime.",
    giftThanks: "The Grand Exchange marks your credit favorably.",
    chargeName: "Gilded Caravel & Balance Scales",
  },
  k_ash: {
    realmId: "k_ash",
    realmName: "Ash Nomads",
    rulerName: "Khal Duran",
    title: "Great Khan of the Cinder Sea",
    blurb: "Horse-masters who gallop across wind-whipped steppes. Khal Duran's outriders strike like wildfire.",
    warTaunt: "Mount up — our arrows will blot out your pale sun!",
    giftThanks: "Tribute worthy of the Cinder Plains.",
    chargeName: "Horned Steppe Skull & Recurve Bow",
  },
  k_veil: {
    realmId: "k_veil",
    realmName: "Veil Theocracy",
    rulerName: "Hierophant Ime",
    title: "Voice of the Unveiled Light",
    blurb: "Spires of carved chalcedony where Hierophant Ime interprets visions through crystal relics.",
    warTaunt: "The Heavens have judged your pride. We bring cleansing fire.",
    giftThanks: "An offering sanctified by heaven.",
    chargeName: "Radiant Eye of Providence & Eightfold Star",
  },
  k_glass: {
    realmId: "k_glass",
    realmName: "Glass Cities",
    rulerName: "Archon Nima",
    title: "Grand Archon of the Prism Spire",
    blurb: "Vitreous domes and academies that outlasted previous cataclysms. Nima guards antiquity's secrets.",
    warTaunt: "Every equation concludes with the ruin of your house.",
    giftThanks: "Your gold is weighed and assayed. It shall endow our instruments.",
    chargeName: "Faceted Astrolabe & Prism Spire",
  },
  k_frost: {
    realmId: "k_frost",
    realmName: "Frost Holds",
    rulerName: "Jarl Signe",
    title: "High Jarl of the Cragged Fjords",
    blurb: "Timber mead-halls on frozen cliffs. Jarl Signe leads huscarls whose war songs echo across glacier passes.",
    warTaunt: "Come face us on the ice, if your marrow does not freeze first!",
    giftThanks: "Skål! The North remembers those who share their feast.",
    chargeName: "Twin Bearded Waraxes & Runic Stag",
  },
  k_tide: {
    realmId: "k_tide",
    realmName: "Tide Princes",
    rulerName: "Admiral Kesh",
    title: "Corsair Admiral of the Broken Atolls",
    blurb: "A lawless armada of galleons and coral coves. Kesh rules with cutlass and cannon.",
    warTaunt: "The black sails fly. We are taking every last penny in your holds!",
    giftThanks: "A handsome ransom before we even fired a broadside.",
    chargeName: "Abyssal Trident & Breaker Waves",
  },
  k_ember: {
    realmId: "k_ember",
    realmName: "Ember Concord",
    rulerName: "Magister Rho",
    title: "Chancellor of the Pyretic Arcana",
    blurb: "Basalt citadels wreathed in lightning. Rho transmutes ore and binds living flame.",
    warTaunt: "You are fuel for our next crucible.",
    giftThanks: "Pure gold, wonderfully conductive to transmutation.",
    chargeName: "Rising Fire-Phoenix & Arcane Flame",
  },
  k_bronze: {
    realmId: "k_bronze",
    realmName: "Bronze League",
    rulerName: "Strategos Helia",
    title: "Strategos-General of the Phalanx",
    blurb: "Colonnades defended by bronze shields and sarissas. Helia values civic virtue and formation discipline.",
    warTaunt: "Our phalanx moves as one soul, one shield, and one spear.",
    giftThanks: "The Council of Equals accepts your civic subvention.",
    chargeName: "Corinthian Hoplite Helm & Laurel Wreath",
  },
};

export function getRealmFlavor(realmId: string): RealmFlavor {
  return (
    REALM_FLAVOR[realmId] ?? {
      realmId,
      realmName: realmId,
      rulerName: "Unknown Ruler",
      title: "Lord",
      blurb: "A sovereign realm of the world.",
      warTaunt: "To arms!",
      giftThanks: "We acknowledge your gift.",
      chargeName: "Heater Shield",
    }
  );
}

export function getRealmBlurb(realmId: string): string {
  return getRealmFlavor(realmId).blurb;
}
export function getWarTaunt(realmId: string): string {
  return getRealmFlavor(realmId).warTaunt;
}
export function getGiftThanks(realmId: string): string {
  return getRealmFlavor(realmId).giftThanks;
}
