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
    blurb:
      "Cast out from your ancestral throne with only loyal retainers and a faded map, your banner rises once more from the ashes. Across wild timberlands and ancient stones, you gather the remnants of a shattered host, forging a second crown that will eclipse the first.",
    warTaunt:
      "By blood and birthright, our ancestral realm shall be reclaimed. Sound the muster horns and unfurl the solar banner!",
    giftThanks:
      "Tribute well rendered to the rightful crown. Your fealty will be remembered when the realm is restored.",
    chargeName: "Imperial Solar Crown",
  },
  rival: {
    realmId: "rival",
    realmName: "Iron March",
    rulerName: "Lord Varric",
    title: "Iron Warmaster",
    blurb:
      "A grim martial juggernaut marching from soot-choked foundries and fortified keeps. Lord Varric commands iron-clad cohorts who know neither parley nor retreat. To the Iron March, peace is merely an interlude between sieges.",
    warTaunt:
      "Your petty mud-walls will crumble beneath our treads! Kneel and yield your crown, or be crushed under iron boots!",
    giftThanks:
      "Gold? A sensible down-payment on your survival, exile. It buys you breath—for today.",
    chargeName: "Crossed Greatswords & Iron Keep",
  },
  k_silk: {
    realmId: "k_silk",
    realmName: "Silk Coast",
    rulerName: "Sera Valin",
    title: "High Factor of the Grand Exchange",
    blurb:
      "Gilded marble harbor-cities where ivory caravels drop anchor laden with spices, damask, and alchemical dyes. Sera Valin counts sovereign treaties in ledgers of profit and loss; every king has a price, and every war is an unpaid invoice.",
    warTaunt:
      "Your customs tariffs and insolence cost us gold, and that is a capital crime. Our sellswords have already been paid in full!",
    giftThanks:
      "Ah, the sweet music of true coin. A generous gesture, friend. The Grand Exchange marks your credit favorably.",
    chargeName: "Gilded Caravel & Balance Scales",
  },
  k_ash: {
    realmId: "k_ash",
    realmName: "Ash Nomads",
    rulerName: "Khal Duran",
    title: "Great Khan of the Cinder Sea",
    blurb:
      "Horse-masters who gallop across wind-whipped steppes and volcanic plains beneath clouds of soot and bone dust. Khal Duran's outriders strike like the wildfire gale, carrying composite recurve bows and dragging thunder in their wake.",
    warTaunt:
      "The wind carries the scent of your burning stores! Mount up, grass-dwellers—our arrows will blot out your pale sun!",
    giftThanks:
      "Tribute worthy of the Cinder Plains! Drink with us by the fire tonight; tomorrow the horde rides again!",
    chargeName: "Horned Steppe Skull & Recurve Bow",
  },
  k_veil: {
    realmId: "k_veil",
    realmName: "Veil Theocracy",
    rulerName: "Hierophant Ime",
    title: "Voice of the Unveiled Light",
    blurb:
      "Soaring spires of carved white chalcedony where censers trail sacred myrrh into the night sky. Hierophant Ime interprets divine visions through radiant crystal relics, shepherding an ecstatic populace that welcomes martyrdom as communion.",
    warTaunt:
      "The Heavens have judged your unholy pride! We come not with malice, but with cleansing fire to scour your heresy!",
    giftThanks:
      "An offering sanctified by heaven. The sacred lamps shall burn incense in your name throughout the outer chapels.",
    chargeName: "Radiant Eye of Providence & Eightfold Star",
  },
  k_glass: {
    realmId: "k_glass",
    realmName: "Glass Cities",
    rulerName: "Archon Nima",
    title: "Grand Archon of the Prism Spire",
    blurb:
      "Ancient, gleaming metropolis of vitreous domes, aqueducts, and philosophical academies that outlasted previous cataclysms. Archon Nima preserves forbidden scrolls and mathematical engines, guarding antiquity's secrets with patient paranoia.",
    warTaunt:
      "We calculated seven thousand outcomes, and every equation concludes with the ruin of your house. Advance if you dare defy geometry.",
    giftThanks:
      "Your gold is weighed and assayed to three decimals of purity. It shall endow our astronomical instruments well.",
    chargeName: "Faceted Astrolabe & Prism Spire",
  },
  k_frost: {
    realmId: "k_frost",
    realmName: "Frost Holds",
    rulerName: "Jarl Signe",
    title: "High Jarl of the Cragged Fjords",
    blurb:
      "Imposing timber mead-halls perched atop sheer frozen cliffs, where longships brave squalls of razor ice. Jarl Signe leads wolf-pelt huscarls whose war songs echo across glacier passes, honoring ancient blood-debts carved in stone.",
    warTaunt:
      "The winter gale hungers for blood, and our axes are cold! Come face us on the ice, southern crow—if your marrow does not freeze first!",
    giftThanks:
      "Skål! Good coin warms the mead-hall like dry pine. The North remembers those who share their feast.",
    chargeName: "Twin Bearded Waraxes & Runic Stag",
  },
  k_tide: {
    realmId: "k_tide",
    realmName: "Tide Princes",
    rulerName: "Admiral Kesh",
    title: "Corsair Admiral of the Broken Atolls",
    blurb:
      "A lawless armada of swift galleons, concealed coral coves, and floating tavern-isles. Admiral Kesh rules with cutlass and cannon, commanding salt-hardened buccaneers who regard kings' land claims as jokes whispered to drowning sailors.",
    warTaunt:
      "Look to your horizons, landlubber! The black sails fly, the sea kraken stirs, and we are taking every last penny in your holds!",
    giftThanks:
      "Ha! A handsome ransom before we even fired a broadside. You're a clever captain—we'll spare your fishing boats this moon.",
    chargeName: "Abyssal Trident & Breaker Waves",
  },
  k_ember: {
    realmId: "k_ember",
    realmName: "Ember Concord",
    rulerName: "Magister Rho",
    title: "Chancellor of the Pyretic Arcana",
    blurb:
      "Floating basalt citadels wreathed in violet lightning and perpetual volcanic braziers. Magister Rho and the arcane council study the fundamental fires of the world, transmuting ore and binding living flames into sovereign war engines.",
    warTaunt:
      "You are fuel to be consumed in our next grand crucible. Let us see how your armor holds against twenty thousand degrees of arcane fire!",
    giftThanks:
      "Pure sovereign gold, wonderfully conductive to high-order transmutation. The Concord acknowledges your erudite courtesy.",
    chargeName: "Rising Fire-Phoenix & Arcane Flame",
  },
  k_bronze: {
    realmId: "k_bronze",
    realmName: "Bronze League",
    rulerName: "Strategos Helia",
    title: "Strategos-General of the Phalanx",
    blurb:
      "Sun-bleached colonnades and democratic councils defended by an unbreakable wall of bronze aspis shields and twelve-foot sarissas. Strategos Helia values civic virtue, unwavering formation discipline, and the iron rule of law.",
    warTaunt:
      "You have broken the interstate concordat! Our phalanx moves as one soul, one shield, and one spear. Step into our vanguard and be broken!",
    giftThanks:
      "The Council of Equals votes to accept your civic subvention. Order and civil discourse are preserved between our states.",
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
      blurb: "A sovereign realm of the world with its own banners, people, and imperial ambitions.",
      warTaunt: "To arms! Our banners march to war!",
      giftThanks: "We acknowledge your gift with gratitude.",
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
