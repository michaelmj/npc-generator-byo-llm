import { CONSTANTS, isRequesting, npcGenBYOLLMLib } from "./lib.js";
import { npcGenBYOLLMDataStructure } from "./dataStructures.js";

export class npcGenBYOLLMEnhanceNPC extends Application {
    constructor(npc) {
        super();
        this.npc = npc;
        this.data = {};
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: CONSTANTS.MODULE_ID,
            title: game.i18n.localize("npc-generator-byo-llm.enhance.title"),
            template: `modules/${CONSTANTS.MODULE_ID}/templates/${CONSTANTS.TEMPLATE.ENHANCE}`,
            width: 300,
            height: 170
        });
    }

    async getData(options) {
        const data = await super.getData(options);
        data.selectOptions = npcGenBYOLLMLib.getDialogOptions('cr', true)
          .filter(obj => obj.value !== "random") 
          .map(obj => {
            if (obj.value === this.npc.system.details.cr) {
              return { ...obj, isSelected: 'selected' };
            }
            return obj;
          });
        return data;
      }      

    activateListeners(html) {
        super.activateListeners(html);
        html.find('#npcGenBYOLLM_enhance-btn').click(this.initEnhancing.bind(this));
    }

    async initEnhancing() {
        if (isRequesting) {
            ui.notifications.warn(`${CONSTANTS.LOG_PREFIX} ${game.i18n.localize("npc-generator-byo-llm.status.wait")}`);
            return;
        }

        const button = this.element.find('#npcGenBYOLLM_enhance-btn');
        button.text(game.i18n.localize("npc-generator-byo-llm.dialog.buttonPending"));

        const isBackgroundChecked = this.element.find('#background').prop('checked');
        const selectedCR = this.element.find('#cr').val();

        if (isBackgroundChecked) {
            this.data.gptData = await npcGenBYOLLMLib.callAI(this.initBackgroundNPC());
        }

        if (selectedCR != this.npc.system.details.cr) {
            this.data.npcData = this.initEnhanceNPC(selectedCR);
        }

        button.text(game.i18n.localize("npc-generator-byo-llm.enhance.button"));
        if (this.data.gptData || this.data.npcData) this.updateNPC();
    }

    initBackgroundNPC() {
        const npc = this.npc;
        const type = npc.system.details.type;
        const race = type.value === 'custom' ? type.custom : type.subtype ? `${type.value} (${type.subtype})` : type.value;
        const options = `${npc.name}, ${race}, ${npc.system.details.alignment}`;
        return npcGenBYOLLMDataStructure.getEnhanceQueryTemplate(options);
    }

    initEnhanceNPC(npcCR) {
        const npcAbilities = this.getNpcAbilities(npcCR);
        return {
            abilities: npcAbilities,
            attributes: this.getNpcAttributes(npcCR, npcAbilities.con.value),
            currency: npcGenBYOLLMLib.getNpcCurrency(npcCR),
            details: this.getNpcDetails(npcCR)
        }
    }

    async updateNPC() {
        try {
            const npcData = (this.data.npcData) ? this.data.npcData : { details: { biography: {} } };
            if (this.data.gptData) {
                npcData.details.biography.value = await npcGenBYOLLMLib.getTemplateStructure(CONSTANTS.TEMPLATE.ENHANCESHEET, this.data.gptData);
            }

            await this.npc.update({ system: npcData });
            this.close();

            ui.notifications.info(`${CONSTANTS.LOG_PREFIX} ${game.i18n.format("npc-generator-byo-llm.status.enhance", { npcName: this.npc.name })}`);
        } catch (error) {
            console.error(`${CONSTANTS.LOG_PREFIX} Error during NPC Update:`, error);
            ui.notifications.error(`${CONSTANTS.LOG_PREFIX} ${game.i18n.localize("npc-generator-byo-llm.status.error3")}`);
        }
    }

    getNpcAbilities(npcCR) {
        const profAbilities = npcGenBYOLLMLib.getProficentAbilities(this.npc.system.abilities);
        const npcAbilities = npcGenBYOLLMLib.getNpcAbilities(profAbilities);
        return npcGenBYOLLMLib.scaleAbilities(npcAbilities, npcCR)
    }

    getNpcAttributes(npcCR, npcCon) {
        const npcHp = npcGenBYOLLMLib.getNpcHp(npcCR, npcCon, this.npc.system.traits.size); 
        return {
            hp: { value: npcHp.value, max: npcHp.value, formula: npcHp.formula },
            ac: { value: npcGenBYOLLMLib.getNpcAC(npcCR) }
        }
    }

    getNpcDetails(npcCR) {
        return {
            source: "NPC Generator (GPT)",
            cr: npcCR,
            biography: {}
        }
    }
}
