import { LoadingIcon, decodeData, wait } from "@vuepress/helper/client";
import { useDebounceFn, useEventListener } from "@vueuse/core";
import type { Chart } from "flowchart.ts";
import type { PropType, VNode } from "vue";
import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from "vue";

import { flowchartPresets } from "../utils/index.js";

import "../styles/flowchart.scss";

declare const MARKDOWN_ENHANCE_DELAY: number;

export default defineComponent({
  name: "FlowChart",

  props: {
    /**
     * Flowchart code content
     *
     * 流程图代码内容
     */
    code: { type: String, required: true },

    /**
     * Flowchart id
     *
     * 流程图 id
     */
    id: { type: String, required: true },

    /**
     * Flowchart preset
     *
     * 流程图预设
     */
    preset: {
      type: String as PropType<"ant" | "pie" | "vue">,
      default: "vue",
    },
  },

  setup(props) {
    let flowchart: Chart | null = null;
    const element = shallowRef<HTMLDivElement>();

    const loading = ref(true);
    const scale = ref(1);

    const preset = computed<Record<string, unknown>>(
      () => flowchartPresets[props.preset],
    );

    const getScale = (width: number): number =>
      width < 419 ? 0.8 : width > 1280 ? 1 : 0.9;

    onMounted(() => {
      void Promise.all([
        import(/* webpackChunkName: "flowchart" */ "flowchart.ts"),
        wait(MARKDOWN_ENHANCE_DELAY),
      ]).then(([{ parse }]) => {
        flowchart = parse(decodeData(props.code));

        // Update scale
        scale.value = getScale(window.innerWidth);

        loading.value = false;

        // Draw svg to #id
        flowchart.draw(props.id, { ...preset.value, scale: scale.value });
      });

      useEventListener(
        "resize",
        useDebounceFn(() => {
          if (flowchart) {
            const newScale = getScale(window.innerWidth);

            if (scale.value !== newScale) {
              scale.value = newScale;

              flowchart.draw(props.id, { ...preset.value, scale: newScale });
            }
          }
        }, 100),
      );
    });

    onUnmounted(() => {
      flowchart?.clean();
      flowchart = null;
    });

    return (): (VNode | null)[] => [
      loading.value
        ? h(LoadingIcon, { class: "flowchart-loading", height: 192 })
        : null,
      h("div", {
        ref: element,
        class: ["flowchart-wrapper", props.preset],
        id: props.id,
        style: {
          display: loading.value ? "none" : "block",
        },
      }),
    ];
  },
});
