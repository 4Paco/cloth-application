#import "@preview/vibrant-color:0.2.1": *

// IMPORTANT : IF YOU WANT TO USE THE ORIGINAL FONTS 
// - Download the font from https://github.com/SHAfoin/shafoin-typst-template/tree/main/font
// - On your PC : install them
// - On typst.app : just  upload them in the "Explore files" section, it will be automatically installed

#show: doc => vibrant-color(
  theme: "blue-theme",
  title: "Report",
  authors: (
    "Demange Lyla",
    "Fayet Rémy",
    "Nassar Ivana",
    "Kubler Laura",
    "Iksil Leïla"
  ),
  lang: "fr",
  sub-authors: "",
  description: "CSC_4IG08_TP",
  date: datetime(day: 22, month: 6, year: 2025),
  subject: "Visualising the effect of the Sun on natural dyes",
  // bib-yaml: bibliography("refs.yaml"),
  // logo: image("logo.png", width: 33%),
  doc
)

== Introduction

=== What is the problem with natural dyes and the effect of the sun?

=== Why could this project have an impact on designs?

== Requirements


== Our solution

=== The software : tools used

=== Visualizations available


== How to use : a complete guide

You can #strike[strike text], put it in *bold*, int italic, or *_both_*. 
Subtext #sub[too], super #super[text] also, #underline[underline] some, #overline[overline] others and #highlight[highlight] in the color of the theme. Equations are supported too, like $a^2 + b^2 = c^2$. 

Summary is made automatically, bibliography too as long as you specify a bib-yaml file. 
Customs blocks and a customized code block are available with the functions below.

#warning("Warning block, to warn about something important.")

#info("Info block, to inform about something.")

#comment("Comment block, to add a comment.")

Quote, image, table, footnote, custom caption, reference and many more are available and customized to this template : please refer to the official documentation or #link("https://github.com/SHAfoin/shafoin-typst-template/blob/main/example/example.typ")[
  this example
] of everything in this template for more information. 
