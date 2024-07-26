import { CONSTANTS, isRequesting, npcGenBYOLLMLib } from "./lib.js";
import { npcGenBYOLLMDataStructure } from "./dataStructures.js";

export class npcGenBYOLLMGenerateNPC extends Application {
    constructor() {
        super();
        this.data = {};
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: CONSTANTS.MODULE_ID,
            title: game.i18n.localize("npc-generator-byo-llm.dialog.title"),
            template: `modules/${CONSTANTS.MODULE_ID}/templates/${CONSTANTS.TEMPLATE.DIALOG}`,
            width: 300,
            height: 370
        });
    }

    async getData(options) {
        const data = await super.getData(options);
        const categories = npcGenBYOLLMLib.getDialogCategories(npcGenBYOLLMDataStructure.categoryList);
        data.category = categories.map(category => {
            const arg = (category.value === 'subtype') ? 'commoner' : category.value;
            return { ...category, option: npcGenBYOLLMLib.getDialogOptions(arg, (arg !== 'type' && arg !== 'cr')) };
        });
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('#type').change(this.changeDialogCategory.bind(this));
        html.find('#npcGenBYOLLM_create-btn').click(this.initGeneration.bind(this));
    }

    changeDialogCategory() {
        const npcType = this.element.find('#type option:selected').val();
        const generateOptions = (data, random) => {
            return npcGenBYOLLMLib.getDialogOptions(data, random).map(subtype => {
                if (subtype.translate) subtype.label = game.i18n.localize(subtype.label);
                return `<option value="${subtype.value}">${subtype.label}</option>`;
            }).join('');
        };
        const label = game.i18n.localize(`npc-generator-byo-llm.dialog.subtype.${((npcType === 'npc') ? 'class' : 'label')}`);
        this.element.find("label[for='subtype']").text(`${label}:`);
        this.element.find("#subtype").html(generateOptions(npcType, true));
        this.element.find("#cr").html(generateOptions('cr', npcType === 'npc'));
    }

    async initGeneration() {
        if (isRequesting) {
            ui.notifications.warn(`${CONSTANTS.LOG_PREFIX} ${game.i18n.localize("npc-generator-byo-llm.status.wait")}`);
            return;
        }

        this.generateDialogData();

        const button = this.element.find('#npcGenBYOLLM_create-btn');
        button.text(game.i18n.localize("npc-generator-byo-llm.dialog.buttonPending"));

        const responseData = await npcGenBYOLLMLib.callAI(this.initQuery());

        button.text(game.i18n.localize("npc-generator-byo-llm.dialog.button"));

        if (responseData) {
            this.mergeGptData(responseData);
            this.createNPC();
        }
    }

    generateDialogData() {
        this.data.details = {};
        npcGenBYOLLMDataStructure.categoryList.forEach(category => {
            const dialogCategory = this.element.find(`#${category}`);
            this.data.details[category] = npcGenBYOLLMLib.getSelectedOption(dialogCategory);
        });
        const { cr, race, type, subtype } = this.data.details;
        subtype.value = (type.value === 'commoner') ? type.value : subtype.value;
        this.data.details.optionalName = this.element.find('#name').val();
        this.data.details.sheet = (type.value === 'commoner') ? 'npc-generator-byo-llm.dialog.subtype.label' : 'npc-generator-byo-llm.dialog.subtype.class';
        this.data.abilities = this.generateNpcAbilities(subtype.value, cr.value);
        this.data.attributes = this.generateNpcAttributes(race.value, subtype.value, cr.value);
        this.data.skills = this.generateNpcSkills(race.value, subtype.value);
        this.data.traits = this.generateNpcTraits(race.value, subtype.value);
        this.data.currency = npcGenBYOLLMLib.getNpcCurrency(cr.value);
    }

    initQuery() {
        const { optionalName, gender, race, subtype, alignment } = this.data.details;
        let options = `${gender.label}, ${race.label}, ${subtype.label}, ${alignment.label}`;
        if (optionalName) options = `(${game.i18n.localize("npc-generator-byo-llm.query.name")}: ${optionalName}) ${options}`; 
        return npcGenBYOLLMDataStructure.getGenerateQueryTemplate(options)
    }

    mergeGptData(gptData) {
        const { name: gptName, spells, items, appearance, background, roleplaying, readaloud } = gptData;
        this.data.name = gptName;
        this.data.spells = spells;
        this.data.items = items;
        this.data.details = {
            ...this.data.details,
            source: "NPC Generator (GPT)",
            biography: {
                appearance: appearance,
                background: background,
                roleplaying: roleplaying,
                readaloud: readaloud
            }
        };
    }

    async createNPC() {
        try {
            const { abilities, attributes, details, name, skills, traits, currency } = this.data;
            const fakeAlign = (game.settings.get(CONSTANTS.MODULE_ID, "hideAlignment")) ? game.i18n.localize("npc-generator-byo-llm.sheet.unknown") : details.alignment.label;
            const bioContent = await npcGenBYOLLMLib.getTemplateStructure(CONSTANTS.TEMPLATE.SHEET, this.data);

            const npc = await Actor.create({ name: name, type: "npc" });
            await npc.update({
                system: {
                    details: {
                        source: details.source,
                        cr: details.cr.value,
                        alignment: fakeAlign,
                        race: details.race.label,
                        biography: { value: bioContent },
                        type: { value: 'custom', custom: details.race.label }
                    },
                    traits: { size: traits.size, languages: { value: traits.languages } },
                    abilities: abilities,
                    attributes: {
                        hp: attributes.hp,
                        'ac.value': attributes.ac,
                        movement: attributes.movement,
                        senses: attributes.senses,
                        spellcasting: attributes.spellcasting
                    },
                    skills: skills,
                    currency: currency
                }
            });

            let comp = npcGenBYOLLMLib.getSettingsPacks();
            npcGenBYOLLMLib.addItemstoNpc(npc, comp.items, this.data.items);
            npcGenBYOLLMLib.addItemstoNpc(npc, comp.spells, this.data.spells);

            npc.sheet.render(true);

            this.close();
            ui.notifications.info(`${CONSTANTS.LOG_PREFIX} ${game.i18n.format("npc-generator-byo-llm.status.done", { npcName: name })}`);
        } catch (error) {
            console.error(`${CONSTANTS.LOG_PREFIX} Error during NPC creation:`, error);
            ui.notifications.error(`${CONSTANTS.LOG_PREFIX} ${game.i18n.localize("npc-generator-byo-llm.status.error3")}`);
        }
    }

    generateNpcAbilities(npcSubtype, npcCR) {
        const npcStats = npcGenBYOLLMDataStructure.subtypeData[npcSubtype];
        const profAbilities = (npcSubtype === 'commoner')
            ? npcGenBYOLLMLib.getRandomFromPool(npcStats.save.pool, npcStats.save.max)
            : npcStats.save;
        const npcAbilities = npcGenBYOLLMLib.getNpcAbilities(profAbilities);
        return npcGenBYOLLMLib.scaleAbilities(npcAbilities, npcCR)
    }

    generateNpcAttributes(npcRace, npcSubtype, npcCR) {
        const raceData = npcGenBYOLLMDataStructure.raceData[npcRace];
        const subtypeData = npcGenBYOLLMDataStructure.subtypeData[npcSubtype];
        const measureUnits = game.settings.get(CONSTANTS.MODULE_ID, "movementUnits") ? 'm' : 'ft';
        return {
            hp: npcGenBYOLLMLib.getNpcHp(npcCR, this.data.abilities.con.value, raceData.size),
            ac: npcGenBYOLLMLib.getNpcAC(npcCR),
            spellcasting: subtypeData[npcSubtype]?.spellcasting && 'int',
            movement: { ...((measureUnits === 'm') ? npcGenBYOLLMLib.convertToMeters(raceData.movement) : raceData.movement), units: measureUnits },
            senses: { ...((measureUnits === 'm') ? npcGenBYOLLMLib.convertToMeters(raceData.senses) : raceData.senses), units: measureUnits }
        }
    }

    generateNpcSkills(npcRace, npcSubtype) {
        const { pool: defaultPool, max } = npcGenBYOLLMDataStructure.subtypeData[npcSubtype].skills;
        const pool = (npcRace === 'elf' || npcRace === 'drow')
            ? npcGenBYOLLMLib.getRandomFromPool(defaultPool.filter(skill => skill !== 'prc'), max).concat('prc')
            : npcGenBYOLLMLib.getRandomFromPool(defaultPool, max);

        return pool.reduce((acc, el) => {
            acc[el] = { value: 1, ability: npcGenBYOLLMLib.getSkillAbility(el) };
            return acc;
        }, {});
    }

    generateNpcTraits(npcRace, npcSubtype) {
        const languages = (npcGenBYOLLMDataStructure.raceData[npcRace].lang || []).slice();
        const subtypeLanguages = (npcGenBYOLLMDataStructure.subtypeData[npcSubtype].lang || []).slice();
        for (const subLang of subtypeLanguages) if (!languages.includes(subLang)) languages.push(subLang);
        if (npcRace === 'human' || npcRace === 'halfelf') {
            languages.push(npcGenBYOLLMLib.getRandomFromPool(npcGenBYOLLMDataStructure.languagesList.filter(lang => !languages.includes(lang)), 1)[0]);
        }
        return {
            languages: languages,
            size: npcGenBYOLLMDataStructure.raceData[npcRace].size
        }
    }
}
