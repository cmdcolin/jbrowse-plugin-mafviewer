import { RenderArgsDeserialized } from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import { createJBrowseTheme } from '@jbrowse/core/ui'
import { Feature, featureSpanPx } from '@jbrowse/core/util'

import {
  fillRect,
  getCharWidthHeight,
  getColorBaseMap,
  getContrastBaseMap,
} from './util'

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
  features: Map<string, Feature>
  statusCallback?: (arg: string) => void
}

export function makeImageData({
  ctx,
  renderArgs,
}: {
  ctx: CanvasRenderingContext2D
  renderArgs: RenderArgs
}) {
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
  const canvasWidth = (region.end - region.start) / bpPerPx
  const h = rowHeight * rowProportion
  const theme = createJBrowseTheme(configTheme)
  const colorForBase = getColorBaseMap(theme)
  const contrastForBase = getContrastBaseMap(theme)

  const { charHeight } = getCharWidthHeight()
  const sampleToRowMap = new Map(samples.map((s, i) => [s.id, i]))
  const scale = 1 / bpPerPx
  const f = 0.4
  const h2 = rowHeight / 2
  const hp2 = h / 2
  const offset = (rowHeight - h) / 2

  // sample as alignments
  ctx.font = 'bold 10px Courier New,monospace'

  for (const feature of features.values()) {
    const [leftPx] = featureSpanPx(feature, region, bpPerPx)
    const vals = feature.get('alignments') as Record<string, { data: string }>
    const seq = feature.get('seq').toLowerCase()
    const r = Object.entries(vals)
    for (const [sample, val] of r) {
      const origAlignment = val.data
      const alignment = origAlignment.toLowerCase()

      const row = sampleToRowMap.get(sample)
      if (row === undefined) {
        continue
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
        ctx.fillStyle = 'lightgrey'
        for (let i = 0, o = 0; i < alignment.length; i++) {
          if (seq[i] !== '-') {
            const c = alignment[i]
            const l = leftPx + scale * o
            if (seq[i] === c && c !== '-') {
              fillRect(ctx, l, offset + t, scale + f, h, canvasWidth)
            }
            o++
          }
        }
      }

      // mismatches
      for (let i = 0, o = 0; i < alignment.length; i++) {
        const c = alignment[i]
        if (seq[i] !== '-') {
          if (c !== '-') {
            const l = leftPx + scale * o
            if (seq[i] !== c && c !== ' ') {
              fillRect(
                ctx,
                l,
                offset + t,
                scale + f,
                h,
                canvasWidth,
                mismatchRendering
                  ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    (colorForBase[c as keyof typeof colorForBase] ?? 'black')
                  : 'orange',
              )
            } else if (showAllLetters) {
              fillRect(
                ctx,
                l,
                offset + t,
                scale + f,
                h,
                canvasWidth,
                mismatchRendering
                  ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    (colorForBase[c as keyof typeof colorForBase] ?? 'black')
                  : 'lightblue',
              )
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
              ctx.fillStyle = mismatchRendering
                ? (contrastForBase[c] ?? 'white')
                : 'black'
              if (rowHeight > charHeight) {
                ctx.fillText(origAlignment[i] || '', l + offset, hp2 + t + 3)
              }
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
      }

      const t = rowHeight * row

      ctx.beginPath()
      ctx.fillStyle = 'purple'
      for (let i = 0, o = 0; i < alignment.length; i++) {
        let ins = ''
        while (seq[i] === '-') {
          if (alignment[i] !== '-' && alignment[i] !== ' ') {
            ins += alignment[i]
          }
          i++
        }
        if (ins.length > 0) {
          const l = leftPx + scale * o - 1

          ctx.rect(l, offset + t, 1, h)
          if (bpPerPx < 1) {
            ctx.rect(l - 2, offset + t, 5, 1)
            ctx.rect(l - 2, offset + t + h - 1, 5, 1)
          }
        }
        o++
      }
      ctx.fill()
    }
  }
}
