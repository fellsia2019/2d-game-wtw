import { ERA_NAMES } from '../data/content';
import type { EraId } from '../core/types';

export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}.svg`;
export const unitArt: Record<string, string> = {};
export const descriptions = { shield: 'Держит фронт и поглощает часть урона.', spear: 'Пробивает броню тяжёлых бойцов.', archer: 'Стреляет из-за спины передней линии.', medic: 'Лечит раненых союзников рядом.', raider: 'Быстро сближается и давит на фронт.', thrower: 'Взрыв задевает группу противников.', banner: 'Ускоряет атаки ближайших союзников.', siege: 'Медленный расчёт для разрушения ворот.' };
export const rewardIcons: Record<string, string> = { supply: '◈', wagon: '✦', banner: '⚑', arrows: '➶', bandages: '✚', contract: '◇', pikes: '↟', workshop: '⚒' };

export const unitRole: Record<string, string> = {
 worldWarsShield:'shield',worldWarsAssault:'spear',worldWarsSniper:'archer',worldWarsMedic:'medic',worldWarsJeep:'raider',worldWarsGrenadier:'thrower',worldWarsRadio:'banner',worldWarsArmoredCar:'siege',worldWarsCommander:'siege',
 industrialShield:'shield',industrialBayonet:'spear',industrialRifle:'archer',industrialMedic:'medic',industrialCarbine:'raider',industrialDemolition:'thrower',industrialMechanic:'banner',industrialHowitzer:'siege',industrialBaron:'shield',
 renaissanceCuirassier:'shield',renaissancePikeman:'spear',renaissanceMusket:'archer',renaissanceSurgeon:'medic',renaissanceDragoon:'raider',renaissanceGrenadier:'thrower',renaissanceCaptain:'banner',renaissanceCannon:'siege',renaissanceGeneral:'shield',
 highKnight:'shield',highHalberd:'spear',highCrossbow:'archer',highMonk:'medic',highRider:'raider',highPitch:'thrower',highHerald:'banner',highTrebuchet:'siege',highCastellan:'shield',
 medievalGuard:'shield',medievalPikeman:'spear',medievalLongbow:'archer',medievalHealer:'medic',medievalBerserker:'raider',medievalThrower:'thrower',medievalHorn:'banner',medievalRam:'siege',medievalJarl:'shield',
 stoneShield:'shield',stoneSpear:'spear',stoneSlinger:'archer',stoneShaman:'medic',stoneScout:'raider',stoneThrower:'thrower',stoneTotem:'banner',stoneRam:'siege',
 antiqueLegionary:'shield',antiqueHoplite:'spear',antiquePeltast:'archer',antiqueSurgeon:'medic',antiqueRider:'raider',antiqueScorpion:'thrower',antiqueCenturion:'banner',antiqueBallista:'siege',antiqueLegate:'shield',
 ironShield:'shield',ironSpear:'spear',ironArcher:'archer',ironMedic:'medic',ironRaider:'raider',ironThrower:'thrower',ironBanner:'banner',ironSiege:'siege',ironGate:'bulwark',ironCommandant:'boss',
 bronzeGuard:'shield',bronzeSpear:'spear',bronzeArcher:'archer',bronzeHealer:'medic',bronzeChariot:'raider',bronzePitch:'thrower',bronzeHerald:'banner',bronzeRam:'siege',
 stoneHunter:'raider',stoneBone:'bulwark',stoneEnemySlinger:'archer',stoneWolf:'raider',stoneChief:'boss',bronzeEnemySpear:'spear',bronzeRaider:'raider',bronzeEnemyArcher:'archer',bronzeGate:'bulwark',bronzeKing:'boss'
};
for (const [kind, role] of Object.entries(unitRole)) unitArt[kind] = kind === 'worldWarsCommander' ? 'world-wars-boss'
 : `${kind.startsWith('worldWars') ? 'world-wars' : kind.startsWith('industrial') ? 'industrial' : kind.startsWith('renaissance') ? 'renaissance' : kind.startsWith('high') ? 'high-medieval' : kind.startsWith('medieval') ? 'medieval' : kind.startsWith('antique') ? 'antique' : kind.startsWith('stone') ? 'stone' : kind.startsWith('iron') ? 'iron' : 'bronze'}-u-${role}`;
export const roleOf = (kind: string) => unitRole[kind] ?? kind;
export const portrait = (kind: string, enemy = false) => asset(`${enemy ? 'enemy-' : ''}${unitArt[kind] ?? 'stone-u-shield'}`);
export const eraName = (era: string) => ERA_NAMES[era as EraId] ?? 'Неизвестная эпоха';
