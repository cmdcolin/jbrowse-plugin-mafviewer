# jbrowse-plugin-mafviewer

A viewer for multiple alignment format (MAF) files in JBrowse 2

This is a port of the JBrowse 1 plugin https://github.com/cmdcolin/mafviewer to
JBrowse 2

![](img/1.png)

## Demo

https://jbrowse.org/code/jb2/main/?config=%2Fdemos%2Fmafviewer%2Fhg38%2Fdistconfig.json&session=share-O3sxhB3iS2&password=8Ysiv

## GUI usage (e.g. in JBrowse Desktop)

This short screenshot workflow shows how you can load your own custom MAF files
via the GUI

First install the plugin via the plugin store

![](img/3.png)

Then use the custom "Add track workflow"

![](img/2.png)

## Manual config entry

### Add plugin to your jbrowse 2 config.json

```json
{
  "plugins": [
    {
      "name": "MafViewer",
      "url": "https://unpkg.com/jbrowse-plugin-mafviewer/dist/jbrowse-plugin-mafviewer.umd.production.min.js"
    }
  ]
}
```

### Example MafTabixAdapter config

The MafTabix track is created according to

```json
{
  "type": "MafTrack",
  "trackId": "chrI.bed",
  "name": "chrI.bed",
  "adapter": {
    "type": "MafTabixAdapter",
    "samples": ["ce10", "cb4", "caeSp111", "caeRem4", "caeJap4", "caePb3"],
    "bedGzLocation": {
      "uri": "chrI.bed.gz"
    },
    "index": {
      "location": {
        "uri": "chrI.bed.gz.tbi"
      }
    }
  },
  "assemblyNames": ["c_elegans"]
}
```

### Example BigMafAdapter config

```json
{
  "type": "MafTrack",
  "trackId": "bigMaf",
  "name": "bigMaf (chr22_KI270731v1_random)",
  "adapter": {
    "type": "BigMafAdapter",
    "samples": [
      "hg38",
      "panTro4",
      "rheMac3",
      "mm10",
      "rn5",
      "canFam3",
      "monDom5"
    ],
    "bigBedLocation": {
      "uri": "bigMaf.bb"
    }
  },
  "assemblyNames": ["hg38"]
}
```

### Example with customized sample names and colors

```json
{
  "trackId": "MAF",
  "name": "example",
  "type": "MafTrack",
  "assemblyNames": ["hg38"],
  "adapter": {
    "type": "MafTabixAdapter",
    "bedGzLocation": {
      "uri": "data.txt.gz"
    },
    "index": {
      "location": {
        "uri": "data.txt.gz.tbi"
      }
    },
    "samples": [
      {
        "id": "hg38",
        "label": "Human",
        "color": "rgba(255,255,255,0.7)"
      },
      {
        "id": "panTro4",
        "label": "Chimp",
        "color": "rgba(255,0,0,0.7)"
      },
      {
        "id": "gorGor3",
        "label": "Gorilla",
        "color": "rgba(0,0,255,0.7)"
      },
      {
        "id": "ponAbe2",
        "label": "Orangutan",
        "color": "rgba(255,255,255,0.7)"
      }
    ]
  }
}
```

The samples array is either `string[]|{id:string,label:string,color?:string}[]`

## Creating MAF files

You can create a MAF file from a Cactus pangenome graph using ComparativeGenomeToolkit

This page discusses some examples

https://github.com/ComparativeGenomicsToolkit/cactus/blob/master/doc/progressive.md#using-the-hal-output

I recommend using "--dupeMode all" because using "--dupeMode single" can cause missing blocks of data, but you are welcome to experiment

Thanks to Sam Talbot (https://github.com/SamCT) for initially creating the Cactus -> JBrowse 2 MAF example

## Prepare data

This is the same as the jbrowse 1 mafviewer plugin (currently the similar to
the). This plugin supports two formats

1. BigMaf format, which can be created following UCSC guidelines

2. MAF tabix based format, based on a custom BED created via conversion tools in
   this repo.

The choice between the two is your convenience. BigMaf is a "standard" UCSC
format, basically just a specialized BigBed, so it requires JBrowse 1.14.0 or
newer for it's BigBed support. The custom BED format only requires JBrowse
1.12.3 or newer, so therefore some slightly older JBrowse versions can support
it.

_Note: Both formats start with a MAF as input, and note that your MAF file
should contain the species name and chromosome name e.g. hg38.chr1 in the
sequence identifiers._

### Preparing BigMaf

Follow instructions from https://genome.ucsc.edu/FAQ/FAQformat.html#format9.3
and set the storeType of your track as MAFViewer/Store/SeqFeature/BigMaf

### Preparing the tabix BED format

Start by converting the MAF into a pseudo-BED format using the maf2bed tool

```bash
# from https://github.com/cmdcolin/maf2bed
cargo install maf2bed
cat file.maf | maf2bed hg38 | bgzip > out.bed
tabix -p bed out.bed.gz
```

The second argument to maf2bed is the genome version e.g. hg38 used for the main
species in the MAF (if your MAF comes from a pipeline like Ensembl or UCSC, the
identifiers in the MAF file will say something like hg38.chr1, therefore, the
argument to maf2bed should just be hg38 to remove hg38 part of the identifier.
if your MAF file does not include the species name as part of the identifier,
you should add the species into them the those scaffold/chromosome e.g. create
hg38.chr1 if it was just chr1 before)

If all is well, your BED file should have 6 columns, with
`chr, start, end, id, score, alignment_data`, where `alignment_data` is
separated between each species by `;` and each field in the alignment is
separated by `:`.

### Footnote

If you can't use the `cargo install maf2bed` binary, there is a `bin/maf2bed.pl`
perl version of it in this repo
