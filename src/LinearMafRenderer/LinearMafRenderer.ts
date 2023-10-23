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
    sources: { name: string; color?: string }[]
    rowHeight: number
  }
}) {
  const {
    regions,
    bpPerPx,
    rowHeight,
    theme: configTheme,
    sources,
  } = renderArgs
  const [region] = regions
  const features = renderArgs.features as Map<string, Feature>
  const h = rowHeight
  const theme = createJBrowseTheme(configTheme)
  const colorForBase = getColorBaseMap(theme)
  const contrastForBase = getContrastBaseMap(theme)
  const sampleToRowMap = new Map(sources.map((s, i) => [s.name, i]))
  const scale = 1 / bpPerPx
  const correctionFactor = getCorrectionFactor(bpPerPx)

  // sample as alignments
  ctx.font = 'bold 10px Courier New,monospace'

  for (const feature of features.values()) {
    const [leftPx] = featureSpanPx(feature, region, bpPerPx)
    const vals = feature.get('alignments') as Record<string, { data: string }>
    const seq = feature.get('seq').toLowerCase()
    for (const [sample, val] of Object.entries(vals)) {
      const origAlignment = val.data
      const alignment = origAlignment.toLowerCase()

      // gaps
      ctx.beginPath()
      ctx.fillStyle = 'black'
      const offset0 = (5 / 12) * h
      const h6 = h / 6
      const row = sampleToRowMap.get(sample)
      if (row === undefined) {
        throw new Error(`unknown sample encountered: ${sample}`)
      }
      const t = h * row
      for (let i = 0; i < alignment.length; i++) {
        const l = leftPx + scale * i
        if (alignment[i] === '-') {
          ctx.rect(l, offset0 + t, scale + correctionFactor, h6)
        }
      }
      ctx.fill()
      const offset = (1 / 4) * h
      const h2 = h / 2

      // matches
      ctx.beginPath()
      ctx.fillStyle = 'lightgrey'
      for (let i = 0; i < alignment.length; i++) {
        const c = alignment[i]
        const l = leftPx + scale * i
        if (seq[i] === c && c !== '-') {
          ctx.rect(l, offset + t, scale + correctionFactor, h2)
        }
      }
      ctx.fill()

      // mismatches
      for (let i = 0; i < alignment.length; i++) {
        const c = alignment[i]
        if (seq[i] !== c && c !== '-') {
          const l = leftPx + scale * i
          ctx.fillStyle =
            colorForBase[c as keyof typeof colorForBase] ?? 'purple'
          ctx.fillRect(l, offset + t, scale + correctionFactor, h2)
        }
      }

      // font
      const charSize = { w: 10 }
      if (scale >= charSize.w) {
        for (let i = 0; i < alignment.length; i++) {
          const l = leftPx + scale * i
          const offset = (scale - charSize.w) / 2 + 1
          const c = alignment[i]
          if (seq[i] !== c && c !== '-') {
            ctx.fillStyle = contrastForBase[c] ?? 'black'
            ctx.fillText(origAlignment[i], l + offset, h2 + t + 3)
          }
        }
      }
    }
  }
}
export default class LinearMafRenderer extends FeatureRendererType {
  async render(
    renderProps: RenderArgsDeserialized & {
      sources: { name: string; color?: string }[]
      rowHeight: number
    },
  ) {
    const { regions, bpPerPx, sources, rowHeight } = renderProps
    const [region] = regions
    const height = sources.length * rowHeight
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
