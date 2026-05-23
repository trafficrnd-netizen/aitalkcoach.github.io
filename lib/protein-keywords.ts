// Common product names per protein subcategory code
export const PROTEIN_KEYWORDS: Record<string, string[]> = {
  'protein.recombinant.cytokine': [
    'IL-2 (Interleukin-2)', 'IL-4 (Interleukin-4)', 'IL-6 (Interleukin-6)',
    'IL-10 (Interleukin-10)', 'IL-12 p70', 'IL-17A (Interleukin-17A)',
    'IL-21 (Interleukin-21)', 'TNF-α (Tumor Necrosis Factor-alpha)',
    'IFN-γ (Interferon-gamma)', 'IFN-α (Interferon-alpha/beta)',
    'TGF-β1', 'TGF-β2', 'M-CSF', 'G-CSF', 'GM-CSF',
  ],
  'protein.recombinant.gf': [
    'EGF (Epidermal Growth Factor)', 'bFGF / FGF-2', 'FGF-7 (KGF)',
    'VEGF-A / VEGF-165', 'HGF (Hepatocyte Growth Factor)',
    'PDGF-BB', 'PDGF-AA', 'NGF (Nerve Growth Factor)',
    'BDNF (Brain-Derived Neurotrophic Factor)', 'BMP-2', 'BMP-4',
    'Wnt-3a', 'Wnt-5a', 'Noggin', 'R-spondin 1 (RSPO1)',
    'SCF (Stem Cell Factor)', 'Erythropoietin (EPO)', 'Thrombopoietin (TPO)',
  ],
  'protein.recombinant.receptor': [
    'EGFR (Extracellular Domain)', 'VEGFR-2 (Kinase Domain)',
    'PD-1 (Recombinant)', 'PD-L1 (Recombinant)', 'CTLA-4 (Recombinant)',
    'ACE2 (Recombinant, Human)', 'TLR4-MD2 Complex',
    'HER2 / ErbB2 (ECD)', 'CD80 (B7-1, Recombinant)',
  ],
  'protein.recombinant.enzyme': [
    'DNase I (RNase-free)', 'RNase A', 'Proteinase K',
    'Trypsin (Recombinant, Animal-free)', 'Collagenase Type I',
    'Collagenase Type IV', 'Hyaluronidase', 'Lysozyme',
    'T4 DNA Ligase', 'Cre Recombinase', 'Cas9 Protein (RNP용)',
    'Luciferase (Firefly)', 'β-Galactosidase', 'Alkaline Phosphatase (CIP)',
  ],
  'protein.recombinant.tf': [
    'p53 (Recombinant)', 'NF-κB p65 (Recombinant)', 'STAT3 (Recombinant)',
    'Sox2 (Recombinant)', 'Oct4 (Recombinant)', 'Klf4 (Recombinant)',
    'c-Myc (Recombinant)', 'HIF-1α (Recombinant)',
  ],
  'protein.recombinant.structural': [
    'β-Actin (Recombinant)', 'α-Tubulin (Recombinant)',
    'Vimentin (Recombinant)', 'Lamin B1 (Recombinant)',
    'Collagen Type I (Rat Tail)', 'Collagen Type IV (Mouse)',
    'Fibronectin (Human Plasma)', 'Laminin (Human)', 'Vitronectin (Human)',
  ],

  'protein.antibody.primary_mab': [
    'Anti-β-Actin (monoclonal)', 'Anti-GAPDH (monoclonal)',
    'Anti-α-Tubulin (monoclonal)', 'Anti-p53 (DO-1 clone)',
    'Anti-Ki67 (MIB-1)', 'Anti-PCNA', 'Anti-p21 Waf1/Cip1',
    'Anti-HIF-1α', 'Anti-PD-L1', 'Anti-CD44', 'Anti-CD45',
    'Anti-E-Cadherin', 'Anti-N-Cadherin', 'Anti-Vimentin',
    'Anti-phospho-ERK1/2 (pTpY185/187)', 'Anti-phospho-AKT (Ser473)',
  ],
  'protein.antibody.primary_pab': [
    'Anti-GFP (polyclonal)', 'Anti-FLAG tag (polyclonal)',
    'Anti-His tag (polyclonal)', 'Anti-GST (polyclonal)',
    'Anti-HA tag (polyclonal)', 'Anti-Myc tag (polyclonal)',
    'Anti-cleaved Caspase-3 (Asp175)', 'Anti-cleaved PARP',
    'Anti-LC3B (autophagy marker)', 'Anti-Beclin-1',
  ],
  'protein.antibody.secondary': [
    'Goat Anti-Rabbit IgG (HRP)', 'Goat Anti-Mouse IgG (HRP)',
    'Donkey Anti-Rabbit IgG (HRP)', 'Donkey Anti-Mouse IgG (HRP)',
    'Goat Anti-Rabbit IgG (FITC)', 'Goat Anti-Mouse IgG (FITC)',
    'Goat Anti-Rabbit IgG (Cy3)', 'Donkey Anti-Goat IgG (Alexa 647)',
    'Goat Anti-Rabbit IgG (Alexa Fluor 488)',
    'Goat Anti-Mouse IgG (Alexa Fluor 594)',
  ],
  'protein.antibody.fluorescent': [
    'Anti-CD3-FITC', 'Anti-CD4-PE', 'Anti-CD8-APC',
    'Anti-CD19-BV421', 'Anti-CD56-PE-Cy7', 'Anti-CD25-PE',
    'Anti-CD11b-APC', 'Anti-Foxp3-PE (Intracellular)',
    'Anti-IFN-γ-APC (Intracellular)', 'Anti-IL-4-PE (Intracellular)',
  ],
  'protein.antibody.hrp': [
    'HRP-Streptavidin', 'HRP-Anti-Rabbit IgG',
    'HRP-Anti-Mouse IgG', 'HRP-Anti-Goat IgG',
    'AP-Anti-Rabbit IgG', 'AP-Anti-Mouse IgG',
  ],
  'protein.antibody.recombinant': [
    'Anti-PD-1 (Recombinant Monoclonal)', 'Anti-CTLA-4 (Recombinant)',
    'Anti-VEGF (Bevacizumab Biosimilar, Research)', 'Anti-HER2 Biosimilar (Research)',
  ],

  'protein.analysis.quantification': [
    'BCA Protein Assay Kit', 'Bradford Reagent (Coomassie G-250)',
    'Qubit Protein Assay Kit', 'DC Protein Assay (Lowry)',
    'NanoOrange Protein Quantitation Kit',
  ],
  'protein.analysis.elisa': [
    'Human IL-6 ELISA Kit', 'Human TNF-α ELISA Kit',
    'Human IL-2 ELISA Kit', 'Human IFN-γ ELISA Kit',
    'Mouse IL-6 ELISA Kit', 'Mouse IFN-γ ELISA Kit',
    'Human VEGF ELISA Kit', 'Human Insulin ELISA Kit',
    'CBA (Cytometric Bead Array) Kit', 'Luminex Multiplex Assay Kit',
  ],
  'protein.analysis.wb': [
    'ECL Western Blotting Substrate (HRP)', 'SuperSignal West Femto',
    '4× Laemmli Sample Buffer', 'PVDF Membrane 0.45μm (WB용)',
    'Nitrocellulose Membrane 0.2μm', 'RIPA Lysis Buffer',
    'Phosphatase Inhibitor Cocktail (PhosSTOP)', 'Protease Inhibitor Cocktail (cOmplete)',
    'Skim Milk Blocking Buffer (5%)', 'TBST (TBS-Tween 20)',
  ],
  'protein.analysis.ip': [
    'Protein A/G Magnetic Beads', 'Protein A Agarose Beads',
    'Protein G Agarose Beads', 'Dynabeads Protein A',
    'Anti-FLAG M2 Affinity Gel', 'Co-IP Lysis Buffer',
  ],
  'protein.analysis.ms': [
    'Trypsin Gold (MS Grade)', 'Lys-C (MS Grade)',
    'TMT Labeling Reagent (6-plex)', 'TMT10-plex Reagent',
    'iTRAQ Reagent (4-plex/8-plex)', 'Formic Acid (LC-MS Grade)',
    'Iodoacetamide (IAA, Alkylation용)', 'MMTS (질량분석 전처리)',
  ],

  'protein.electrophoresis.gel': [
    'Precast PAGE Gel 4-20% (Tris-Glycine)', 'Precast PAGE Gel 12%',
    'NuPAGE 4-12% Bis-Tris Gel', 'SDS-PAGE Running Buffer 10×',
    'Transfer Buffer 10× (WB용)',
  ],
  'protein.electrophoresis.marker': [
    'Protein Molecular Weight Marker (10-250 kDa)',
    'Pre-stained Protein Ladder (10-180 kDa)',
    'PageRuler Plus Prestained Protein Ladder',
    'HiMark Pre-stained Protein Standard',
  ],
  'protein.electrophoresis.stain': [
    'Coomassie Brilliant Blue R-250 (CBB)', 'SimplyBlue SafeStain',
    'Silver Stain Kit (High Sensitivity)', 'SYPRO Ruby Protein Stain',
    'Colloidal Coomassie G-250',
  ],

  'protein.purification.affinity': [
    'Ni-NTA Agarose (His-tag 정제)', 'Ni-NTA Magnetic Agarose Beads',
    'Glutathione Sepharose 4B (GST 정제)', 'Anti-FLAG M2 Affinity Gel',
    'Strep-Tactin Sepharose', 'Streptavidin MagneSphere',
    'Protein A Sepharose 4 Fast Flow', 'Protein G Sepharose 4 Fast Flow',
  ],
  'protein.purification.ion_exchange': [
    'DEAE Sepharose Fast Flow (음이온교환)', 'Q Sepharose Fast Flow',
    'SP Sepharose Fast Flow (양이온교환)', 'MonoQ 10/100 GL Column',
    'CM Sepharose Fast Flow',
  ],
  'protein.purification.sec': [
    'Superdex 75 Increase 10/300 GL', 'Superdex 200 Increase 10/300 GL',
    'Superdex 200 pg 16/600', 'Sephadex G-25 (탈염)',
    'Sephacryl S-200 HR',
  ],
  'protein.purification.dialysis': [
    'Slide-A-Lyzer Dialysis Cassette 10K MWCO',
    'Slide-A-Lyzer Dialysis Cassette 3.5K MWCO',
    'Amicon Ultra-15 Centrifugal Filter 10K', 'Amicon Ultra-15 30K',
    'Spectra/Por Dialysis Membrane (3.5 kDa)',
  ],

  'protein.amino_acid.standard': [
    'L-Alanine', 'L-Arginine', 'L-Aspartic Acid',
    'L-Glutamine', 'L-Glycine', 'L-Histidine',
    'L-Leucine', 'L-Lysine HCl', 'L-Methionine',
    'L-Phenylalanine', 'L-Proline', 'L-Serine',
    'L-Tryptophan', 'L-Tyrosine', 'L-Valine',
    'D-Alanine', 'D-Leucine',
  ],
  'protein.amino_acid.protected': [
    'Fmoc-Gly-OH', 'Fmoc-Ala-OH', 'Fmoc-Leu-OH',
    'Fmoc-Phe-OH', 'Fmoc-Lys(Boc)-OH', 'Fmoc-Arg(Pbf)-OH',
    'Fmoc-Ser(tBu)-OH', 'Fmoc-Thr(tBu)-OH',
    'Boc-Ala-OH', 'Boc-Gly-OH', 'Boc-Lys(Z)-OH',
    'Wang Resin (PS)', 'Rink Amide MBHA Resin',
  ],
  'protein.amino_acid.peptide': [
    'RGD Peptide (Cyclic cRGDfK)', 'IKVAV Peptide (Laminin-derived)',
    'Amyloid β1-42 (Aβ42)', 'Amyloid β1-40 (Aβ40)',
    'Poly-L-Lysine (PLL)', 'Poly-D-Lysine (PDL)',
    'Cell-Penetrating Peptide (TAT)', 'CRGDS Adhesion Peptide',
    'Angiogenin 45-65 Peptide', 'Substance P',
  ],
  'protein.amino_acid.library': [
    'Random Peptide Library (Phage Display용)',
    'Combinatorial Peptide Library', 'Peptide Array (Custom Synthesis)',
    'One-Bead-One-Compound (OBOC) Library',
  ],

  'protein.expression.cell_free': [
    'TNT Quick Coupled System (Rabbit Reticulocyte Lysate)',
    'PURExpress In Vitro Protein Synthesis Kit',
    'Wheat Germ Extract Cell-Free System',
    'HeLa Lysate-based Cell-Free System',
  ],
  'protein.expression.ecoli': [
    'pET-28a 발현 벡터', 'pGEX-4T-1 발현 벡터 (GST)',
    'BL21(DE3) Competent Cell', 'Rosetta(DE3) Competent Cell',
    'BL21(DE3) pLysS Competent Cell', 'IPTG (발현 유도)',
    'Auto-Induction Medium (Overnight Express)',
  ],
  'protein.expression.yeast': [
    'EasySelect Pichia Expression Kit', 'pPICZ 발현 벡터',
    'pPIC9K 벡터 (분비 발현)', 'Pichia GS115 Competent Cell',
  ],
  'protein.expression.insect': [
    'Bac-to-Bac Baculovirus Expression System',
    'pFastBac 발현 벡터', 'Sf9 Insect Cell (Spodoptera frugiperda)',
    'High Five Cell (BTI-Tn-5B1-4)', 'Sf-900 III SFM 배지',
  ],
  'protein.expression.mammalian': [
    'pcDNA3.1(+) 발현 벡터', 'pLenti-CMV 발현 벡터',
    'Lipofectamine 3000 (형질감염 시약)',
    'FreeStyle 293 Expression System', 'Expi293 Expression System',
    'CHO-S Expression System',
  ],
}

// Shown before any subcategory is selected
export const PROTEIN_GENERAL_KEYWORDS = [
  '재조합 사이토카인 (Cytokine)', '성장인자 (Growth Factor)',
  '1차 항체 (Primary Antibody)', '2차 항체 (Secondary Antibody)',
  'ELISA 키트', '단백질 정량 키트 (BCA/Bradford)',
  '합성 펩타이드 (Synthetic Peptide)',
  'BSA (Bovine Serum Albumin)', 'Collagen Type I',
  'Fibronectin (Human)', 'Streptavidin',
]
