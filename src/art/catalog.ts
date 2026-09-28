
export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}.svg`;
export const unitArt: Record<string, string> = {};
export const descriptions = { shield: 'Держит фронт и поглощает часть урона.', spear: 'Пробивает броню тяжёлых бойцов.', archer: 'Стреляет из-за спины передней линии.', medic: 'Лечит раненых союзников рядом.', raider: 'Быстро сближается и давит на фронт.', thrower: 'Взрыв задевает группу противников.', banner: 'Ускоряет атаки ближайших союзников.', siege: 'Медленный расчёт для разрушения ворот.' };
export const rewardIcons: Record<string, string> = { supply: '◈', wagon: '✦', banner: '⚑', arrows: '➶', bandages: '✚', contract: '◇', pikes: '↟', workshop: '⚒' };

export const unitRole: Record<string, string> = {
 stoneShield:'shield',stoneSpear:'spear',stoneSlinger:'archer',stoneShaman:'medic',stoneScout:'raider',stoneThrower:'thrower',stoneTotem:'banner',stoneRam:'siege',
 bronzeGuard:'shield',bronzeSpear:'spear',bronzeArcher:'archer',bronzeHealer:'medic',bronzeChariot:'raider',bronzePitch:'thrower',bronzeHerald:'banner',bronzeRam:'siege',
 stoneHunter:'raider',stoneBone:'bulwark',stoneEnemySlinger:'archer',stoneWolf:'raider',stoneChief:'boss',bronzeEnemySpear:'spear',bronzeRaider:'raider',bronzeEnemyArcher:'archer',bronzeGate:'bulwark',bronzeKing:'boss'
};
for (const [kind, role] of Object.entries(unitRole)) unitArt[kind] = `${kind.startsWith('stone') ? 'stone' : 'bronze'}-u-${role}`;
export const roleOf = (kind: string) => unitRole[kind] ?? kind;
export const portrait = (kind: string, enemy = false) => asset(`${enemy ? 'enemy-' : ''}${unitArt[kind] ?? 'stone-u-shield'}`);
export const eraName = (era: string) => era === 'stone' ? 'Каменный век' : era === 'bronze' ? 'Бронзовый век' : 'Бронзовый век';
