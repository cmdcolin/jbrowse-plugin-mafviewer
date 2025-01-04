import { FeatureRendererType } from '@jbrowse/core/pluggableElementTypes'
import { RenderArgsDeserialized } from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import { createJBrowseTheme } from '@jbrowse/core/ui'
import {
  Feature,
  Region,
  featureSpanPx,
  renderToAbstractCanvas,
} from '@jbrowse/core/util'

import { getColorBaseMap, getContrastBaseMap } from './util'

interface Sample {
  id: string
  color?: string
}
interface RenderArgs extends RenderArgsDeserialized {
  samples: Sample[]
  rowHeight: number
  rowProportion: number
  showAllLetters: boolean
  mismatchRendering: boolean
}

function makeImageData({
  ctx,
  renderArgs,
}: {
  ctx: CanvasRenderingContext2D
  renderArgs: RenderArgs & { features: Map<string, Feature> }
}) {
  console.log('makeImageData')
  const {
    regions,
    bpPerPx,
    rowHeight,
    showAllLetters,
    theme: configTheme,
    mismatchRendering,
    samples,
    rowProportion,
    features,
  } = renderArgs
  const region = regions[0]!
  const h = rowHeight * rowProportion
  const theme = createJBrowseTheme(configTheme)
  const colorForBase = getColorBaseMap(theme)
  const contrastForBase = getContrastBaseMap(theme)
  const sampleToRowMap = new Map(samples.map((s, i) => [s.id, i]))
  const scale = 1 / bpPerPx
  const f = 0.4
  const h2 = rowHeight / 2
  const hp2 = h / 2
  const offset = (rowHeight - h) / 2

  // sample as alignments
  ctx.font = 'bold 10px Courier New,monospace'
  console.log({ features })

  for (const feature of features.values()) {
    const [leftPx] = featureSpanPx(feature, region, bpPerPx)
    const vals = feature.get('alignments') as Record<string, { data: string }>
    const seq = feature.get('seq').toLowerCase()
    for (const [sample, val] of Object.entries(vals)) {
      const origAlignment = val.data
      const alignment = origAlignment.toLowerCase()

      const row = sampleToRowMap.get(sample)
      if (row === undefined) {
        continue
        throw new Error(`unknown sample encountered: ${sample}`)
      }

      const t = rowHeight * row

      // gaps
      ctx.beginPath()
      ctx.fillStyle = 'black'
      for (let i = 0, o = 0; i < alignment.length; i++) {
        if (seq[i] !== '-') {
          if (alignment[i] === '-') {
            const l = leftPx + scale * o
            ctx.moveTo(l, t + h2)
            ctx.lineTo(l + scale + f, t + h2)
          }
          o++
        }
      }
      ctx.stroke()

      if (!showAllLetters) {
        // matches
        ctx.beginPath()
        ctx.fillStyle = 'lightgrey'
        for (let i = 0, o = 0; i < alignment.length; i++) {
          if (seq[i] !== '-') {
            const c = alignment[i]
            const l = leftPx + scale * o
            if (seq[i] === c && c !== '-') {
              ctx.rect(l, offset + t, scale + f, h)
            }
            o++
          }
        }
        ctx.fill()
      }

      // mismatches
      for (let i = 0, o = 0; i < alignment.length; i++) {
        const c = alignment[i]
        if (seq[i] !== '-') {
          if (c !== '-') {
            const l = leftPx + scale * o
            if (seq[i] !== c) {
              ctx.fillStyle = mismatchRendering
                ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                  (colorForBase[c as keyof typeof colorForBase] ?? 'black')
                : 'orange'
              ctx.fillRect(l, offset + t, scale + f, h)
            } else if (showAllLetters) {
              ctx.fillStyle = mismatchRendering
                ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                  (colorForBase[c as keyof typeof colorForBase] ?? 'black')
                : 'lightblue'
              ctx.fillRect(l, offset + t, scale + f, h)
            }
          }
          o++
        }
      }

      // font
      const charSizeW = 10
      if (scale >= charSizeW) {
        for (let i = 0, o = 0; i < alignment.length; i++) {
          if (seq[i] !== '-') {
            const l = leftPx + scale * o
            const offset = (scale - charSizeW) / 2 + 1
            const c = alignment[i]!
            if ((showAllLetters || seq[i] !== c) && c !== '-') {
              ctx.fillStyle = contrastForBase[c] ?? 'white'
              ctx.fillText(origAlignment[i] || '', l + offset, hp2 + t + 3)
            }
            o++
          }
        }
      }
    }
  }

  // second pass for insertions, has slightly improved look since the
  // insertions are always 'on top' of the other features
  for (const feature of features.values()) {
    const [leftPx] = featureSpanPx(feature, region, bpPerPx)
    const vals = feature.get('alignments') as Record<string, { data: string }>
    const seq = feature.get('seq').toLowerCase()

    for (const [sample, val] of Object.entries(vals)) {
      const origAlignment = val.data
      const alignment = origAlignment.toLowerCase()
      const row = sampleToRowMap.get(sample)
      if (row === undefined) {
        continue
        throw new Error(`unknown sample encountered: ${sample}`)
      }

      const t = rowHeight * row

      ctx.beginPath()
      ctx.fillStyle = 'purple'
      for (let i = 0, o = 0; i < alignment.length; i++) {
        let ins = ''
        while (seq[i] === '-') {
          if (alignment[i] !== '-') {
            ins += alignment[i]
          }
          i++
        }
        if (ins.length > 0) {
          const l = leftPx + scale * o - 1
          ctx.rect(l, offset + t + 1, 1, h - 1)
          ctx.rect(l - 2, offset + t, 5, 1)
          ctx.rect(l - 2, offset + t + h - 1, 5, 1)
        }
        o++
      }
      ctx.fill()
    }
  }
}
export default class LinearMafRenderer extends FeatureRendererType {
  getExpandedRegion(region: Region) {
    const { start, end } = region
    const bpExpansion = 1

    return {
      // xref https://github.com/mobxjs/mobx-state-tree/issues/1524 for Omit
      ...(region as Omit<typeof region, symbol>),
      start: Math.floor(Math.max(start - bpExpansion, 0)),
      end: Math.ceil(end + bpExpansion),
    }
  }
  async render(renderProps: RenderArgs) {
    const { regions, bpPerPx, samples, rowHeight } = renderProps
    const region = regions[0]!
    const height = samples.length * rowHeight + 100
    const width = (region.end - region.start) / bpPerPx
    const features = await this.getFeatures(renderProps)
    const res = await renderToAbstractCanvas(
      width,
      height,
      renderProps,
      ctx => {
        makeImageData({
          ctx,
          renderArgs: {
            ...renderProps,
            features,
          },
        })
        return undefined
      },
    )
    const results = await super.render({
      ...renderProps,
      ...res,
      width,
      height,
    })
    return {
      ...results,
      ...res,
      width,
      height,
    }
  }
}
