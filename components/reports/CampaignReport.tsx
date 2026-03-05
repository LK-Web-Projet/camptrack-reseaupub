"use client";

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";

// ============================================================
// DESIGN SYSTEM — Moderne & Contrasté
// Blanc pur · Noir profond · Rouge #d61353 (accent unique)
// ============================================================
const C = {
    white: "#ffffff",
    offwhite: "#f9f9f9",
    gray100: "#f2f2f2",
    gray200: "#e0e0e0",
    gray400: "#9b9b9b",
    gray600: "#555555",
    ink: "#111111",
    red: "#d61353",
    redDark: "#a50e3f",
    redSoft: "#fff0f4",
};

const F = {
    bold: "Helvetica-Bold" as const,
    reg: "Helvetica" as const,
    obl: "Helvetica-Oblique" as const,
};

// ============================================================
// STYLES
// ============================================================
const S = StyleSheet.create({

    page: {
        fontFamily: F.reg,
        backgroundColor: C.white,
        color: C.ink,
        padding: 0,
    },

    // ── HEADER ─────────────────────────────────────────────────
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 48,
        paddingVertical: 16,
        backgroundColor: C.white,
        borderBottomWidth: 1,
        borderBottomColor: C.gray200,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    headerAccentBar: {
        width: 3,
        height: 24,
        backgroundColor: C.red,
        borderRadius: 2,
    },
    headerTitle: {
        fontFamily: F.bold,
        fontSize: 11,
        color: C.ink,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    headerSub: {
        fontSize: 8,
        color: C.gray400,
        letterSpacing: 1,
        marginTop: 2,
    },
    headerLogo: {
        width: 88,
        height: 26,
        objectFit: "contain",
    },

    // ── FOOTER ─────────────────────────────────────────────────
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 32,
        backgroundColor: C.ink,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 48,
    },
    footerText: {
        fontSize: 7,
        color: C.gray400,
        letterSpacing: 0.8,
    },
    footerPageNum: {
        fontSize: 7,
        color: C.white,
        fontFamily: F.bold,
        letterSpacing: 1,
    },
    footerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: C.red,
    },

    // ── BODY ───────────────────────────────────────────────────
    body: {
        flex: 1,
        paddingHorizontal: 48,
        paddingTop: 24,
        paddingBottom: 40,
    },

    // ── SECTION TITLE ──────────────────────────────────────────
    sectionTitle: {
        fontFamily: F.bold,
        fontSize: 9,
        color: C.red,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 20,
    },

    // ─────────────────────────────────────────────────────────
    // 1. PAGE DE GARDE
    // ─────────────────────────────────────────────────────────
    coverPage: {
        flex: 1,
        flexDirection: "row",
    },

    // Colonne gauche noire (40%)
    coverLeft: {
        width: "40%",
        backgroundColor: C.ink,
        padding: 44,
        justifyContent: "space-between",
    },
    coverLogoBox: {
        backgroundColor: C.white,
        borderRadius: 4,
        padding: 8,
        width: 110,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    coverLogo: {
        width: 90,
        height: 30,
        objectFit: "contain",
    },
    coverTextBlock: {
        flex: 1,
        justifyContent: "center",
    },
    coverRedLine: {
        width: 32,
        height: 3,
        backgroundColor: C.red,
        marginBottom: 18,
    },
    coverEyebrow: {
        fontFamily: F.bold,
        fontSize: 8,
        color: C.red,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 14,
    },
    coverTitle: {
        fontFamily: F.bold,
        fontSize: 28,
        color: C.white,
        lineHeight: 1.25,
        marginBottom: 10,
    },
    coverCampaignName: {
        fontFamily: F.bold,
        fontSize: 16,
        color: C.red,
        marginBottom: 16,
    },
    coverDesc: {
        fontSize: 9,
        color: C.gray400,
        lineHeight: 1.6,
    },
    coverBottomMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    coverMetaDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: C.red,
    },
    coverMetaText: {
        fontSize: 7,
        color: C.gray600,
        letterSpacing: 0.8,
    },

    // Colonne droite — photo (60%)
    coverRight: {
        width: "60%",
        position: "relative",
    },
    coverImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    coverImageOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: C.ink,
        opacity: 0.5,
    },
    coverTag: {
        position: "absolute",
        bottom: 24,
        left: 24,
        backgroundColor: C.red,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 2,
    },
    coverTagText: {
        fontFamily: F.bold,
        fontSize: 8,
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 2,
    },

    // ─────────────────────────────────────────────────────────
    // 2. STATISTIQUES
    // ─────────────────────────────────────────────────────────
    statsBigRow: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 16,
    },
    statHero: {
        flex: 1,
        backgroundColor: C.ink,
        borderRadius: 6,
        padding: 32,
        justifyContent: "space-between",
        minHeight: 110,
    },
    statHeroAccent: {
        backgroundColor: C.red,
    },
    statHeroVal: {
        fontFamily: F.bold,
        fontSize: 52,
        color: C.white,
        lineHeight: 1,
    },
    statHeroLabel: {
        fontFamily: F.bold,
        fontSize: 8,
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 2,
        opacity: 0.7,
    },
    statsSmallRow: {
        flexDirection: "row",
        gap: 16,
    },
    statSmall: {
        flex: 1,
        borderWidth: 1,
        borderColor: C.gray200,
        borderRadius: 6,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    statSmallIconBar: {
        width: 3,
        height: 36,
        backgroundColor: C.red,
        borderRadius: 2,
    },
    statSmallVal: {
        fontFamily: F.bold,
        fontSize: 18,
        color: C.ink,
        marginBottom: 4,
    },
    statSmallLabel: {
        fontSize: 7,
        color: C.gray400,
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },

    // ─────────────────────────────────────────────────────────
    // 3. TABLEAU PLAQUES
    // ─────────────────────────────────────────────────────────
    tableContainer: {
        borderRadius: 6,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: C.gray200,
    },
    tableHeaderRow: {
        backgroundColor: C.ink,
        height: 28,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    tableHeaderText: {
        fontFamily: F.bold,
        fontSize: 7,
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    tableRow: {
        flexDirection: "row",
    },
    tableCell: {
        flex: 1,
        height: 28,
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: C.gray200,
        backgroundColor: C.white,
    },
    tableCellAlt: {
        backgroundColor: C.offwhite,
    },
    tableCellMissing: {
        backgroundColor: C.redSoft,
    },
    tableCellText: {
        fontFamily: F.bold,
        fontSize: 8,
        color: C.ink,
        letterSpacing: 0.5,
    },
    tableCellTextMissing: {
        color: C.red,
    },
    tableNote: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: C.offwhite,
        borderRadius: 4,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: C.red,
    },
    tableNoteText: {
        fontSize: 8,
        color: C.gray600,
        flex: 1,
        lineHeight: 1.6,
    },

    // ─────────────────────────────────────────────────────────
    // 4. INTERCALAIRE
    // ─────────────────────────────────────────────────────────
    dividerPage: {
        flex: 1,
        flexDirection: "row",
    },
    dividerLeft: {
        flex: 1,
        backgroundColor: C.red,
        justifyContent: "center",
        padding: 52,
    },
    dividerRight: {
        flex: 1,
        backgroundColor: C.ink,
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 52,
    },
    dividerNumber: {
        fontFamily: F.bold,
        fontSize: 120,
        color: C.white,
        opacity: 0.08,
        lineHeight: 1,
        position: "absolute",
        top: 20,
        left: 40,
    },
    dividerEyebrow: {
        fontFamily: F.bold,
        fontSize: 8,
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 4,
        opacity: 0.7,
        marginBottom: 16,
    },
    dividerTitle: {
        fontFamily: F.bold,
        fontSize: 42,
        color: C.white,
        lineHeight: 1.15,
        letterSpacing: 1,
    },
    dividerSub: {
        fontSize: 10,
        color: C.white,
        opacity: 0.5,
        marginTop: 16,
        lineHeight: 1.5,
    },

    // ─────────────────────────────────────────────────────────
    // 5. ALBUM PHOTO
    // ─────────────────────────────────────────────────────────
    photoGrid: {
        flexDirection: "row",
        gap: 16,
        flex: 1,
        paddingBottom: 0,
    },
    photoCard: {
        flex: 1,
        height: "100%",
        flexDirection: "column",
        borderRadius: 6,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: C.gray200,
    },
    photoImg: {
        flex: 1,
        width: "100%",
        objectFit: "cover",
    },
    photoCaption: {
        backgroundColor: C.ink,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    photoCaptionDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: C.red,
    },
    photoCaptionLabel: {
        fontSize: 7,
        color: C.gray400,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    photoCaptionValue: {
        fontFamily: F.bold,
        fontSize: 9,
        color: C.white,
    },

    // ─────────────────────────────────────────────────────────
    // 6. CONCLUSION
    // ─────────────────────────────────────────────────────────
    conclusionPage: {
        flex: 1,
        flexDirection: "row",
    },
    conclusionLeft: {
        flex: 1,
        backgroundColor: C.ink,
        padding: 52,
        justifyContent: "space-between",
    },
    conclusionRight: {
        width: "36%",
        backgroundColor: C.red,
        padding: 40,
        justifyContent: "space-between",
    },
    conclusionEyebrow: {
        fontFamily: F.bold,
        fontSize: 8,
        color: C.red,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 18,
    },
    conclusionTitle: {
        fontFamily: F.bold,
        fontSize: 26,
        color: C.white,
        lineHeight: 1.3,
        marginBottom: 20,
    },
    conclusionBody: {
        fontSize: 10,
        color: C.gray400,
        lineHeight: 1.8,
    },
    conclusionLogo: {
        width: 100,
        height: 32,
        objectFit: "contain",
    },
    contactSectionTitle: {
        fontFamily: F.bold,
        fontSize: 8,
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 24,
        opacity: 0.7,
    },
    contactItem: {
        marginBottom: 20,
    },
    contactItemLabel: {
        fontSize: 7,
        color: C.white,
        opacity: 0.5,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    contactItemValue: {
        fontFamily: F.bold,
        fontSize: 11,
        color: C.white,
    },
    conclusionTagline: {
        fontSize: 8,
        color: C.white,
        opacity: 0.4,
        fontFamily: F.obl,
    },
});

// ============================================================
// TYPES
// ============================================================
export type ReportData = {
    campagne: {
        id: string;
        nom: string | null;
        description: string | null;
        dateDebut: string | Date | null;
        dateFin: string | Date | null;
    };
    kpis: {
        nbPrestatairesCible: number | null;
        totalPrestataires: number;
        dureejours: number | null;
    };
    prestataires: Array<{
        nom?: string | null;
        prenom?: string | null;
        plaque?: string | null;
        idVerification?: string | null;
    }>;
    visualEvidence: Array<{
        url: string;
        caption: string;
        plaque: string | null;
        prestataire: string;
    }>;
};

const fmt = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    try {
        return new Date(String(d)).toLocaleDateString("fr-FR", {
            day: "2-digit", month: "2-digit", year: "numeric",
        });
    } catch { return String(d); }
};

// ============================================================
// COMPOSANTS PARTAGÉS
// ============================================================
const Header = ({ title }: { title: string }) => (
    <View style={S.header} fixed>
        <View style={S.headerLeft}>
            <View style={S.headerAccentBar} />
            <View>
                <Text style={S.headerTitle}>{title}</Text>
                <Text style={S.headerSub}>ReseauPub — Rapport Campagne Tricycles</Text>
            </View>
        </View>
        <Image src="/images/logo_mixte.webp" style={S.headerLogo} />
    </View>
);

const Footer = () => (
    <View style={S.footer} fixed>
        <Text style={S.footerText}>
            © {new Date().getFullYear()} ReseauPub · Document confidentiel
        </Text>
        <View style={S.footerDot} />
        <Text
            style={S.footerPageNum}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
    </View>
);

// ============================================================
// 1. PAGE DE GARDE
// ============================================================
const CoverSlide = ({ campagneNom }: { campagneNom: string }) => (
    <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.coverPage}>

            {/* Colonne gauche noire */}
            <View style={S.coverLeft}>
                <View style={S.coverLogoBox}>
                    <Image src="/images/logo_mixte.webp" style={S.coverLogo} />
                </View>

                <View style={S.coverTextBlock}>
                    <View style={S.coverRedLine} />
                    <Text style={S.coverEyebrow}>Rapport de Campagne</Text>
                    <Text style={S.coverTitle}>Tricycles</Text>
                    <Text style={S.coverCampaignName}>{campagneNom}</Text>
                    <Text style={S.coverDesc}>
                        Récapitulatif des déploiements,{"\n"}
                        statistiques et preuves visuelles.
                    </Text>
                </View>

                <View style={S.coverBottomMeta}>
                    <View style={S.coverMetaDot} />
                    <Text style={S.coverMetaText}>
                        Généré le {new Date().toLocaleDateString("fr-FR")}
                    </Text>
                </View>
            </View>

            {/* Colonne droite — image */}
            <View style={S.coverRight}>
                <Image src="/images/tricycles.avif" style={S.coverImage} />
                <View style={S.coverImageOverlay} />
                <View style={S.coverTag}>
                    <Text style={S.coverTagText}>Campagne terrain</Text>
                </View>
            </View>

        </View>
    </Page>
);

// ============================================================
// 2. STATISTIQUES
// ============================================================
const StatsSlide = ({ data }: { data: ReportData }) => (
    <Page size="A4" orientation="landscape" style={S.page}>
        <Header title="Statistiques Globales" />
        <View style={S.body}>
            <Text style={S.sectionTitle}>Vue d'ensemble de la campagne</Text>

            <View style={S.statsBigRow}>
                <View style={S.statHero}>
                    <Text style={S.statHeroVal}>{data.kpis.nbPrestatairesCible ?? "—"}</Text>
                    <Text style={S.statHeroLabel}>Tricycles demandés</Text>
                </View>
                <View style={[S.statHero, S.statHeroAccent]}>
                    <Text style={S.statHeroVal}>{data.kpis.totalPrestataires}</Text>
                    <Text style={S.statHeroLabel}>Panneaux affichés</Text>
                </View>
            </View>

            <View style={S.statsSmallRow}>
                {[
                    { val: fmt(data.campagne.dateDebut), label: "Date de démarrage" },
                    { val: `${data.kpis.dureejours ?? "—"} jrs`, label: "Durée de la campagne" },
                    { val: fmt(data.campagne.dateFin), label: "Fin de campagne" },
                ].map((item, i) => (
                    <View key={i} style={S.statSmall}>
                        <View style={S.statSmallIconBar} />
                        <View>
                            <Text style={S.statSmallVal}>{item.val}</Text>
                            <Text style={S.statSmallLabel}>{item.label}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
        <Footer />
    </Page>
);

// ============================================================
// 3. RÉCAPITULATIF DES PLAQUES
// ============================================================
const COLS = 6;
const CELLS_PER_PAGE = COLS * 11;

const RecapPlaquesSlide = ({
    prestataires,
}: {
    prestataires: ReportData["prestataires"];
}) => {
    const sansPlaqueCount = prestataires.filter(
        (p) => !p.plaque || p.plaque.trim() === ""
    ).length;

    const pages: ReportData["prestataires"][] = [];
    const MAX_ROWS = 12; // Adjusted rows per page based on new padding
    const CELLS_PER_PAGE_DYNAMIC = COLS * MAX_ROWS;

    for (let i = 0; i < prestataires.length; i += CELLS_PER_PAGE_DYNAMIC) {
        pages.push(prestataires.slice(i, i + CELLS_PER_PAGE_DYNAMIC));
    }
    if (pages.length === 0) pages.push([]);

    return (
        <>
            {pages.map((pageData, pageIdx) => {
                const rows: ReportData["prestataires"][] = [];
                for (let i = 0; i < pageData.length; i += COLS)
                    rows.push(pageData.slice(i, i + COLS));

                return (
                    <Page key={pageIdx} size="A4" orientation="landscape" style={S.page}>
                        <Header title="Numéros Matricules" />
                        <View style={S.body}>
                            <Text style={S.sectionTitle}>
                                Récapitulatif des {prestataires.length} tricycles déployés
                            </Text>
                            <View style={S.tableContainer}>
                                <View style={S.tableHeaderRow}>
                                    <Text style={S.tableHeaderText}>
                                        Numéros d'immatriculation des tricycles
                                    </Text>
                                </View>
                                {rows.map((row, rIdx) => (
                                    <View key={rIdx} style={S.tableRow}>
                                        {row.map((p, cIdx) => {
                                            const has = p.plaque && p.plaque.trim().length > 0;
                                            const isAlt = rIdx % 2 === 1;
                                            return (
                                                <View
                                                    key={cIdx}
                                                    style={[
                                                        S.tableCell,
                                                        isAlt && !has ? S.tableCellMissing : {},
                                                        !isAlt && !has ? S.tableCellMissing : {},
                                                        isAlt && has ? S.tableCellAlt : {},
                                                    ]}
                                                >
                                                    <Text style={[S.tableCellText, !has ? S.tableCellTextMissing : {}]}>
                                                        {has ? p.plaque : "—"}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                        {Array.from({ length: COLS - row.length }).map((_, i) => (
                                            <View key={`e${i}`} style={[S.tableCell, rIdx % 2 === 1 ? S.tableCellAlt : {}]} />
                                        ))}
                                    </View>
                                ))}
                            </View>

                            {pageIdx === pages.length - 1 && (
                                <View style={S.tableNote}>
                                    <Text style={S.tableNoteText}>
                                        <Text style={{ fontFamily: F.bold }}>Note : </Text>
                                        {prestataires.length} tricycles déployés au total.
                                        {sansPlaqueCount > 0
                                            ? ` ${sansPlaqueCount} tricycle(s) sans numéro matricule identifié, indiqués par « — » en surbrillance.`
                                            : " Toutes les plaques ont été identifiées avec succès."}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Footer />
                    </Page>
                );
            })}
        </>
    );
};

// ============================================================
// 4. INTERCALAIRE ALBUM
// ============================================================
const AlbumDividerSlide = () => (
    <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.dividerPage}>
            <View style={S.dividerLeft}>
                <Text style={S.dividerNumber}>04</Text>
                <View>
                    <Text style={S.dividerEyebrow}>Section suivante</Text>
                    <Text style={S.dividerTitle}>Album{"\n"}Photos</Text>
                    <Text style={S.dividerSub}>
                        Preuves visuelles de déploiement{"\n"}terrain des tricycles.
                    </Text>
                </View>
            </View>
            <View style={S.dividerRight}>
                <Text style={{ fontFamily: F.bold, fontSize: 9, color: C.gray400, textTransform: "uppercase", letterSpacing: 2 }}>
                    Ce que vous allez voir
                </Text>
                {[
                    "Photos de déploiement sur le terrain",
                    "Numéros matricule associés",
                    "Couverture visuelle complète",
                ].map((item, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 }}>
                        <View style={{ width: 20, height: 1, backgroundColor: C.red }} />
                        <Text style={{ fontSize: 9, color: C.gray400, flex: 1 }}>{item}</Text>
                    </View>
                ))}
            </View>
        </View>
    </Page>
);

// ============================================================
// 5. ALBUM PHOTO — 2 par page
// ============================================================
const VisualEvidenceSlide = ({
    visualEvidence,
}: {
    visualEvidence: ReportData["visualEvidence"];
}) => {
    if (visualEvidence.length === 0) return null;
    const groups: ReportData["visualEvidence"][] = [];
    for (let i = 0; i < visualEvidence.length; i += 2)
        groups.push(visualEvidence.slice(i, i + 2));

    return (
        <>
            {groups.map((group, pageIdx) => (
                <Page key={pageIdx} size="A4" orientation="landscape" style={S.page}>
                    <Header title="Preuves Visuelles" />
                    <View style={[S.body, { paddingTop: 20 }]}>
                        <View style={S.photoGrid}>
                            {group.map((photo, pIdx) => (
                                <View key={pIdx} style={S.photoCard}>
                                    <Image src={photo.url} style={S.photoImg} />
                                    <View style={S.photoCaption}>
                                        <View style={S.photoCaptionDot} />
                                        <View>
                                            <Text style={S.photoCaptionLabel}>Numéro matricule</Text>
                                            <Text style={S.photoCaptionValue}>
                                                {photo.plaque && photo.plaque.trim().length > 0
                                                    ? photo.plaque
                                                    : "Non renseigné"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                    <Footer />
                </Page>
            ))}
        </>
    );
};

// ============================================================
// 6. CONCLUSION
// ============================================================
const ConclusionSlide = () => (
    <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.conclusionPage}>

            {/* Gauche — texte */}
            <View style={S.conclusionLeft}>
                <View>
                    <Text style={S.conclusionEyebrow}>Merci de votre confiance</Text>
                    <Text style={S.conclusionTitle}>
                        Un partenariat solide,{"\n"}une communication efficace.
                    </Text>
                    <Text style={S.conclusionBody}>
                        L'agence RESEAUPUB s'engage à vous offrir une visibilité terrain
                        de qualité. Cette campagne illustre notre capacité à déployer
                        rapidement et rigoureusement vos dispositifs publicitaires.
                    </Text>
                </View>
                <Image src="/images/logo_mixte.webp" style={S.conclusionLogo} />
            </View>

            {/* Droite rouge — contacts */}
            <View style={S.conclusionRight}>
                <Text style={S.contactSectionTitle}>Nous contacter</Text>
                <View>
                    <View style={S.contactItem}>
                        <Text style={S.contactItemLabel}>Téléphone</Text>
                        <Text style={S.contactItemValue}>+229 01 69 81 30 30</Text>
                    </View>
                    <View style={S.contactItem}>
                        <Text style={S.contactItemLabel}>Email</Text>
                        <Text style={S.contactItemValue}>info@reseaupub.com</Text>
                    </View>
                </View>
                <Text style={S.conclusionTagline}>
                    La communication, c'est notre terrain.
                </Text>
            </View>

        </View>
    </Page>
);

// ============================================================
// EXPORT
// ============================================================
export default function CampaignReport({ data }: { data: ReportData }) {
    const enhVisualEvidence = data.visualEvidence.map((ve) => {
        const prest = data.prestataires.find(
            (p) => `${p.prenom} ${p.nom}`.trim() === ve.prestataire
        );
        return { ...ve, plaque: ve.plaque || prest?.plaque || null };
    });

    return (
        <Document
            title={`RAPPORT_CAMPAGNE_TRICYCLES_${data.campagne.nom ?? ""}`}
            author="RESEAUPUB"
        >
            <CoverSlide campagneNom={data.campagne.nom ?? ""} />
            <StatsSlide data={data} />
            <RecapPlaquesSlide prestataires={data.prestataires} />
            <AlbumDividerSlide />
            <VisualEvidenceSlide visualEvidence={enhVisualEvidence} />
            <ConclusionSlide />
        </Document>
    );
}