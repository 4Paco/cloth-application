#import "@preview/vibrant-color:0.2.1": *

// IMPORTANT : IF YOU WANT TO USE THE ORIGINAL FONTS 
// - Download the font from https://github.com/SHAfoin/shafoin-typst-template/tree/main/font
// - On your PC : install them
// - On typst.app : just  upload them in the "Explore files" section, it will be automatically installed

#show: doc => vibrant-color(
  theme: "red-theme",
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

When designing a piece of clothing, designers can't necessarily predict how their garnment will age. Visualizing the evolution of natural dyes subjected to the sun has begun to be researched, so if this software could have data from the most used natural dyes and their evolution according to their exposition to sunlight, designers could almost predict how they will fade and change through time. 

=== Why could this project have an impact on designs?

With Today's mass consumption, fast and extra fast fashion accompagnied of cours by climate change, it becomes crucial to be capable to envision this evolution if designers want to make clothes that will last longuer and encourage their consumers to not buy unless necessary. Indeed, while some dyes don't change much when exposed to sunlight, others become very different and therefore, the piece of cloth becomes a different one thant the one the consumer bought. While some may like this color changing property, there is no guarantee that the consumer will like the new color, or in case of patterns and using multiple dyes, there is no guarantees that the dyes exposed to sunlight will be as harmonious as before. 

== Requirements

In the beginning, we understood the subject as visualizinng the effect of time on clothes. We did research on our end but found ourselves stuck because, sadly, there is not much research on this, or there can be research but on one specific piece of clothing or material for instance. However, after our first meeting with our supervisor and other researchers, the direction of the project changed.

#info("We would create a website allowing designers to visualize the effect of sun exposure on clothes tainted with natural dyes.")
This shift allowed us to see more clearly what visualization would be needed and what data and research would be important on our part. We would not especially focus on research papers but on how to allow designers to visualize the aging of dyes and to build tools to help them select them. 

=== The data
The data was given to us by the researchers as it is something they are working on, and there is not much data available elsewhere. To be able to test our software on larger amounts of data, we also created fake data points.
talk about SCIELAB et le delta E (perceived color)

=== Visualizing the evolution of dyes
 visualization on the cie scale in the beginning, we show the way dyes evolves and change related to other colors
 Linear representation on the size once a dye has been selected

=== Selecting dyes and colors
To select dyes, the user will be able to select a certain zone in which they accept the color (a color close by  % etc)

== Our solution

=== The software : tools used
React with npm, js, librairie for 3 visualizing etc (add all ressources)

=== Visualizations available
heatmpa creation, how color is perceived according to light placement

== Organization 
=== Meetings
meetings with pano and researchers semi-regularly, meeting every week at the beginning

== Within the group 
We defined tasks that were most important and each person took one. Had meeting almost every week to meet up and see where the project is. 
Put what you did, I'll formulate later 
Ivana : 
Laura : 
Rémy : 
Lyla :
Leïla : some buttons for switching pages, slider for heatmap page, light placement and visualization of light placement, report, brainstorm on visualization, research for papers on the subject before and afte precising the subject.

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
