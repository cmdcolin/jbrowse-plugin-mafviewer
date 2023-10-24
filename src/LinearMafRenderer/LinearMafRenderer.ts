import { FeatureRendererType } from '@jbrowse/core/pluggableElementTypes'
import { RenderArgsDeserialized } from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import { createJBrowseTheme } from '@jbrowse/core/ui'
import {
  Feature,
  featureSpanPx,
  renderToAbstractCanvas,
} from '@jbrowse/core/util'
import { Theme } from '@mui/material'

function getCorrectionFactor(scale: number) {
  if (scale >= 1) {
    return 0.6
  } else if (scale >= 0.2) {
    return 0.05
  } else if (scale >= 0.02) {
    return 0.03
  } else {
    return 0.02
  }
}

export function getContrastBaseMap(theme: Theme) {
  return Object.fromEntries(
    Object.entries(getColorBaseMap(theme)).map(([key, value]) => [
      key,
      theme.palette.getContrastText(value),
    ]),
  )
}

export function getColorBaseMap(theme: Theme) {
  const { bases } = theme.palette
  return {
    a: bases.A.main,
    c: bases.C.main,
    g: bases.G.main,
    t: bases.T.main,
  }
}
function makeImageData({
  ctx,
  renderArgs,
}: {
  ctx: CanvasRenderingContext2D
  renderArgs: RenderArgsDeserialized & {
    samples: { id: string; color?: string }[]
    rowHeight: number
    rowProportion: number
  }
}) {
  const {
    regions,
    bpPerPx,
    rowHeight,
    theme: configTheme,
    samples,
    rowProportion,
  } = renderArgs
  const [region] = regions
  const features = renderArgs.features as Map<string, Feature>
  const h = rowHeight
  const theme = createJBrowseTheme(configTheme)
  const colorForBase = getColorBaseMap(theme)
  const contrastForBase = getContrastBaseMap(theme)
  const sampleToRowMap = new Map(samples.map((s, i) => [s.id, i]))
  const scale = 1 / bpPerPx
  const f = getCorrectionFactor(bpPerPx)

  // sample as alignments
  ctx.font = 'bold 10px Courier New,monospace'

  for (const feature of features.values()) {
    const [leftPx] = featureSpanPx(feature, region, bpPerPx)
    const vals = feature.get('alignments') as Record<string, { data: string }>
    const seq = feature.get('seq').toLowerCase()
    for (const [sample, val] of Object.entries(vals)) {
      const origAlignment = val.data
      const alignment = origAlignment.toLowerCase()

      const row = sampleToRowMap.get(sample)
      if (row === undefined) {
        throw new Error(`unknown sample encountered: ${sample}`)
      }
      const h2 = h * rowProportion
      const offset = h2 / 2
      const t = h * row

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

      // matches
      ctx.beginPath()
      ctx.fillStyle = 'lightgrey'
      for (let i = 0, o = 0; i < alignment.length; i++) {
        if (seq[i] !== '-') {
          const c = alignment[i]
          const l = leftPx + scale * o
          if (seq[i] === c && c !== '-') {
            ctx.rect(l, offset + t, scale + f, h2)
          }
          o++
        }
      }
      ctx.fill()

      // mismatches
      for (let i = 0, o = 0; i < alignment.length; i++) {
        const c = alignment[i]
        if (seq[i] !== '-') {
          if (seq[i] !== c && c !== '-') {
            const l = leftPx + scale * o
            ctx.fillStyle =
              colorForBase[c as keyof typeof colorForBase] ?? 'purple'
            ctx.fillRect(l, offset + t, scale + f, h2)
          }
          o++
        }
      }

      // font
      const charSize = { w: 10 }
      if (scale >= charSize.w) {
        for (let i = 0, o = 0; i < alignment.length; i++) {
          if (seq[i] !== '-') {
            const l = leftPx + scale * o
            const offset = (scale - charSize.w) / 2 + 1
            const c = alignment[i]
            if (seq[i] !== c && c !== '-') {
              ctx.fillStyle = contrastForBase[c] ?? 'black'
              ctx.fillText(origAlignment[i], l + offset, h2 + t + 3)
            }
            o++
          }
        }
      }

      //insertions
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
        if (ins.length) {
          const l = leftPx + scale * o
          ctx.rect(l, offset + t, 2, h2)
          ctx.rect(l - 2, offset + t, 6, 1)
          ctx.rect(l - 2, offset + t + h2, 6, 1)
        }
        o++
      }
      ctx.fill()
    }
  }
}
export default class LinearMafRenderer extends FeatureRendererType {
  async render(
    renderProps: RenderArgsDeserialized & {
      samples: { id: string; color?: string }[]
      rowHeight: number
      rowProportion: number
    },
  ) {
    const { regions, bpPerPx, samples, rowHeight } = renderProps
    const [region] = regions
    const height = samples.length * rowHeight
    const width = (region.end - region.start) / bpPerPx
    const features = await this.getFeatures(renderProps)
    const res = await renderToAbstractCanvas(width, height, renderProps, ctx =>
      makeImageData({
        ctx,
        renderArgs: {
          ...renderProps,
          features,
        },
      }),
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
