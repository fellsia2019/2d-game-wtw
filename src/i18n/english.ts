import type { EraId, UnitKind } from '../core/types';

// Names are keyed by game IDs so balancing and save data stay language neutral.
export const englishUnits: Record<UnitKind, [name: string, role: string]> = {
  stoneShield: ['Cave Guard', 'Defender · sturdy stone shield'],
  stoneSpear: ['Spear Hunter', 'Anti-armor · long spear'],
  stoneSlinger: ['Slinger', 'Ranged · short range'],
  stoneShaman: ['Tribal Healer', 'Support · heals troops'],
  stoneScout: ['Scout', 'Ambush · stronger first strike against ranged units'],
  stoneThrower: ['Boulder Thrower', 'Area damage · rockfall'],
  stoneTotem: ['Tribal Standard Bearer', 'Commander · speeds up attacks'],
  stoneRam: ['Ram Crew', 'Siege · breaks fortifications'],
  bronzeGuard: ['Bronze Guard', 'Defender · stronger armor near the phalanx'],
  bronzeSpear: ['Phalanx Spearman', 'Anti-armor · formation improves defense'],
  bronzeArcher: ['City Archer', 'Ranged · aimed volley'],
  bronzeHealer: ['City Healer', 'Support · heals troops'],
  bronzeChariot: ['Charioteer', 'Breakthrough · swift attack'],
  bronzePitch: ['Pitch Thrower', 'Area damage · burning volley'],
  bronzeHerald: ['Herald', 'Commander · speeds up attacks'],
  bronzeRam: ['Siege Ram', 'Siege · powerful strike'],
  ironShield: ['Iron Shieldbearer', 'Defender · large shield and strong armor'],
  ironSpear: ['Warband Spearman', 'Anti-armor · pierces heavy armor'],
  ironArcher: ['Outpost Archer', 'Ranged · covers the front line'],
  ironMedic: ['Field Medic', 'Support · heals troops'],
  ironRaider: ['Raider', 'Breakthrough · axe pressure on archers'],
  ironThrower: ['Javelin Thrower', 'Area damage · volley against groups'],
  ironBanner: ['Standard Bearer', 'Support · speeds up allies without attacking'],
  ironSiege: ['Siege Crew', 'Siege · ram crew breaks the gates'],
  antiqueLegionary: ['Legionary', 'Defender · scutum and formation defense'],
  antiqueHoplite: ['Hoplite', 'Anti-armor · spear and formation defense'],
  antiquePeltast: ['Peltast', 'Ranged · throws javelins from behind the line'],
  antiqueSurgeon: ['Camp Surgeon', 'Support · bandages the wounded'],
  antiqueRider: ['Numidian Rider', 'Breakthrough · fast rider with javelins'],
  antiqueScorpion: ['Scorpion', 'Area damage · bolt pierces tight groups'],
  antiqueCenturion: ['Centurion', 'Support · orders speed up the formation'],
  antiqueBallista: ['Ballista', 'Siege · long-range strikes on fortifications'],
  medievalGuard: ['Warband Guard', 'Defender · large kite shield'],
  medievalPikeman: ['Pikeman', 'Anti-armor · two-handed pike'],
  medievalLongbow: ['Longbowman', 'Ranged · tall wooden bow'],
  medievalHealer: ['Herbalist', 'Healing · herbs and bandages'],
  medievalBerserker: ['Berserker', 'Breakthrough · after a melee hit, the next attack within 2 seconds deals 20% more damage'],
  medievalThrower: ['Axe Thrower', 'Area damage · throwing axes against groups'],
  medievalHorn: ['Horn Blower', 'Support · signal speeds up allies'],
  medievalRam: ['Battering Ram', 'Siege · wheeled ram with two crew members'],
  'highKnight': ['Shield Knight', 'Defender · sword and shield'],
  'highHalberd': ['Halberdier', 'Anti-armor · two-handed halberd'],
  'highCrossbow': ['Crossbowman', 'Ranged · shot and reload'],
  'highMonk': ['Castle Healer', 'Healing · tends the wounded'],
  'highRider': ['Mounted Raider', 'Breakthrough · cavalry against the back line'],
  'highPitch': ['Pitch Burner', 'Area damage · burning pitch against groups'],
  'highHerald': ['Herald', 'Support · banner speeds up allies'],
  'highTrebuchet': ['Trebuchet', 'Siege · counterweight, sling, and stone'],
  renaissanceCuirassier: ['Cuirassier', 'Defender · cuirass and shield'],
  renaissancePikeman: ['Guard Pikeman', 'Anti-armor · long pike'],
  renaissanceMusket: ['Musketeer', 'Ranged · powerful shot, long reload'],
  renaissanceSurgeon: ['Military Surgeon', 'Healing · field dressings'],
  renaissanceDragoon: ['Light Dragoon', 'Breakthrough · cavalry against the back line'],
  renaissanceGrenadier: ['Grenadier', 'Area damage · grenade against groups'],
  renaissanceCaptain: ['Company Captain', 'Support · banner speeds up allies'],
  renaissanceCannon: ['Field Cannon', 'Siege · artillery against fortifications'],
  industrialShield: ['Armored Guard', 'Defender · armor plate and shield'],
  industrialBayonet: ['Bayonet Infantry', 'Anti-armor · rifle with bayonet'],
  industrialRifle: ['Rifleman', 'Ranged · overheats after 3 shots'],
  industrialMedic: ['Train Medic', 'Healing · bandages and medical kit'],
  industrialCarbine: ['Assault Carbineer', 'Breakthrough · attacks the back line; overheats after 3 shots'],
  industrialDemolition: ['Demolitionist', 'Area damage · explosives against groups'],
  industrialMechanic: ['Mechanic', 'Support · speeds up allies and reduces overheating'],
  industrialHowitzer: ['Field Howitzer', 'Siege · heavy shot; overheats after 3 shots'],
  worldWarsShield: ['Trench Shieldbearer', 'Defender · steel trench shield'],
  worldWarsAssault: ['Assault Trooper', 'Anti-armor · anti-armor launcher'],
  worldWarsSniper: ['Sniper', 'Ranged · precise rifle shot and suppression'],
  worldWarsMedic: ['Frontline Medic', 'Healing · treats troops at the front'],
  worldWarsJeep: ['Recon Jeep', 'Breakthrough · exposes a target for 4 seconds'],
  worldWarsGrenadier: ['Grenade Launcher', 'Area damage · explosive shot against groups'],
  worldWarsRadio: ['Radio Operator', 'Support · radio signal speeds up allied fire'],
  worldWarsArmoredCar: ['Armored Car', 'Siege · wheeled artillery against fortifications'],
  modernShield: ['Special Forces Shield', 'Defender · heavy assault shield'],
  modernAntiTank: ['Anti-tank Trooper', 'Anti-armor · shoulder-fired launcher'],
  modernMarksman: ['Marksman', 'Ranged · precision rifle'],
  modernMedic: ['Combat Medic', 'Healing · mobile medical support'],
  modernRecon: ['Recon Operator', 'Breakthrough · quick strike against the back line'],
  modernGrenadier: ['Rocket Grenadier', 'Area damage · volley against groups'],
  modernDroneOperator: ['Strike Drone Operator', 'Support · drone flies to its target and explodes'],
  modernArtillery: ['Artillery Crew', 'Siege · howitzer against fortifications'],
  stoneHunter: ['Night Hunter', 'Enemy · rapid breakthrough'],
  stoneBone: ['Bone Shield', 'Enemy · cover'],
  stoneEnemySlinger: ['Tribal Slinger', 'Enemy · ranged attack'],
  stoneWolf: ['Pack Leader', 'Enemy · fast attacks'],
  stoneChief: ['Blackstone Chief', 'Boss · crushes formations'],
  bronzeEnemySpear: ['Bronze Spearman', 'Enemy · pierces armor'],
  bronzeRaider: ['Raider Chariot', 'Enemy · breakthrough'],
  bronzeEnemyArcher: ['Guard Archer', 'Enemy · ranged attack'],
  bronzeGate: ['Gate Guard', 'Enemy · heavy armor'],
  bronzeKing: ['King of the Copper Gates', 'Boss · bronze charge'],
  ironGate: ['Gate Guardian', 'Enemy · heavy armor and two-handed hammer'],
  ironCommandant: ['Iron Citadel Commandant', 'Boss · saber strike against formations'],
  antiqueLegate: ['Ninth Legion Legate', 'Boss · veteran legionary with a reinforced scutum'],
  medievalJarl: ['Northern Fort Jarl', 'Boss · warband fighter who strikes formations'],
  highCastellan: ['Stone Castle Castellan', 'Boss · knight with guards'],
  renaissanceGeneral: ['Smoky Front General', 'Boss · cuirassier with guards'],
  industrialBaron: ['Steelworks Baron', 'Boss · armored guard with escort'],
  worldWarsCommander: ['Armored Junction Commander', 'Boss · unique light tank with escort'],
  modernCommander: ['Autonomous Base Commander', 'Boss · heavy shieldbearer with guards']
};

export const englishEras: Record<EraId, string> = {
  stone: 'Stone Age', bronze: 'Bronze Age', iron: 'Iron Age', antique: 'Antiquity',
  medieval: 'Early Middle Ages', 'high-medieval': 'High Middle Ages',
  renaissance: 'Renaissance and Gunpowder', industrial: 'Industrial Age',
  'world-wars': 'Age of Armored Vehicles', modern: 'Modern Age'
};

export const englishBattles: Record<EraId, [name: string, threat: string][]> = {
  stone: [
    ['Night Ambush', 'Night hunters rapidly approach the fortress'],
    ['Bone Shield Wall', 'Bone shields protect the slingers'],
    ['Pack Trail', 'The pack leader launches fast attacks'],
    ['Blackstone Chief', 'The chief enters battle when the fortress reaches 50% health']
  ],
  bronze: [
    ['Chariot Road', 'Chariots break through the ranged line'],
    ['Bronze Phalanx', 'Spearmen advance under cover of gate guards'],
    ['City Walls', 'Archers fire from behind a tight formation'],
    ['King of the Copper Gates', 'At 50% fortress health, the king leads an assault wave']
  ],
  iron: [
    ['Iron Outpost', 'Raiders advance under cover of shieldbearers; meet them with an early front line'],
    ['Warband Shield Wall', "The gate guardian's hammer breaks the line; spearmen pierce his armor"],
    ['Siege Road', 'Shields and archers cover the ram; break through to the back line'],
    ['Iron Citadel', 'At 50% fortress health, the commandant deploys a guard, archer, and thrower']
  ],
  antique: [
    ['Border Camp', 'Riders throw javelins under cover of legionaries'],
    ['Phalanx at the Crossing', 'Legionaries and hoplites protect peltasts; a centurion speeds up the formation'],
    ['Province Walls', 'Scorpions and a ballista fire from behind scutums'],
    ['Ninth Legion', 'At 50% fortress health, the legate deploys a legionary, peltast, and centurion']
  ],
  medieval: [
    ['Forest Ambush', 'Berserkers break through to archers and retaliate after melee strikes'],
    ['Shield Line', 'Pikes and large shields advance at the horn signal; longbowmen break the formation'],
    ['Northern Town Siege', 'Two shield lines cover a longbowman, axe thrower, and battering ram; pikemen defend the fortress'],
    ['Northern Fort', 'Shields, pikes, and ranged troops hold the fort; at 50% fortress health, the jarl arrives with guards and a healer']
  ],
  'high-medieval': [
    ['Mounted Ambush', 'Cavalry breaks through to the crossbowmen; shields hold the front'],
    ['Halberd Line', 'Halberds and shields advance under the banner while crossbows fire from behind'],
    ['Stone Castle Siege', 'Shields cover crossbows, pitch, and trebuchet; halberdiers defend the gates'],
    ["Castellan's Citadel", 'At 50% fortress health, the castellan deploys knights, cavalry, and a healer']
  ],
  renaissance: [
    ['Dragoon Raid', 'Cuirassiers hold the front while dragoons break through to musketeers'],
    ['Pike and Powder', 'Pikemen protect musketeers under the company banner'],
    ['Star Fort Siege', 'Cuirassiers cover the artillery; pikemen defend the bastion'],
    ['Smoky Front Headquarters', 'At 50% fort health, the general deploys his guard and a surgeon']
  ],
  industrial: [
    ['Railway Raid', 'Carbineers flank armored guards and attack riflemen'],
    ['Factory Line', 'Bayonet troops and riflemen hold the front with mechanic support'],
    ['Foundry Yard Siege', 'Demolitionists and a howitzer fire from behind armor; bayonet troops defend the gates'],
    ['Steelworks', 'At 50% fortress health, the baron deploys armored guards and a medic']
  ],
  'world-wars': [
    ['Trench Recon', 'Recon jeeps flank shields and expose weak points for snipers'],
    ['Trench Line', 'Assault troops and snipers hold the line under radio support; suppressive fire slows troops'],
    ['Armored Junction Breakthrough', 'Grenade launchers and an armored car fire from the trenches; assault troops defend the fortress'],
    ['Armored Junction', 'At 50% fortress health, the commander emerges in a light tank with guards and a medic']
  ],
  modern: [
    ['Perimeter Recon', 'Recon operators flank shields under marksman fire'],
    ['Remote Fire Line', 'Anti-tank troops cover marksmen; strike drones explode at their targets'],
    ['Fortified Sector Assault', 'Grenadiers and artillery fire from behind shields; anti-tank troops defend the fortress'],
    ['Autonomous Base', 'At 50% fortress health, the shield commander deploys guards, a medic, and a drone operator']
  ]
};
