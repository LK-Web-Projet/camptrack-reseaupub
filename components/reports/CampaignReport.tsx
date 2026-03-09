"use client";

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";
import { IMG_LOGO_MIXTE, IMG_TRICYCLES } from "@/lib/pdf-assets";

// ============================================================
// DESIGN SYSTEM — Refonte moderne
// ============================================================
const C = {
    white: "#ffffff",
    offwhite: "#fafafa",
    gray100: "#f0f0f0",
    gray200: "#e0e0e0",
    gray400: "#a0a0a0",
    gray600: "#6b6b6b",
    ink: "#1a1a1a",
    red: "#d61353",
    redDark: "#b00f45",
    redLight: "#ffe6ed",
};

const F = {
    bold: "Helvetica-Bold",
    reg: "Helvetica",
    light: "Helvetica-Light",
    obl: "Helvetica-Oblique",
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

    // ----- HEADER -----
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 48,
        paddingVertical: 20,
        backgroundColor: C.white,
        borderBottomWidth: 1,
        borderBottomColor: C.gray200,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    headerAccent: {
        width: 4,
        height: 28,
        backgroundColor: C.red,
        borderRadius: 2,
    },
    headerTitle: {
        fontFamily: F.bold,
        fontSize: 16,
        color: C.ink,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    headerSub: {
        fontSize: 11,
        color: C.gray400,
        marginTop: 2,
    },
    headerLogo: {
        width: 90,
        height: 28,
        objectFit: "contain",
    },

    // ----- FOOTER -----
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 36,
        backgroundColor: C.ink,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 48,
    },
    footerText: {
        fontSize: 10,
        color: C.gray400,
        letterSpacing: 0.5,
    },
    footerPageNum: {
        fontSize: 10,
        color: C.white,
        fontFamily: F.bold,
    },
    footerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: C.red,
    },

    // ----- BODY -----
    body: {
        flex: 1,
        paddingHorizontal: 48,
        paddingTop: 30,
        paddingBottom: 40,
    },

    // ----- SECTION TITLE -----
    sectionTitle: {
        fontFamily: F.bold,
        fontSize: 16, // Augmenté pour plus de lisibilité
        color: C.red,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 24,
        textAlign: "center", // Centré pour plus d'impact
    },

    // ----- COVER -----
    coverPage: {
        flex: 1,
        flexDirection: "row",
    },
    coverLeft: {
        width: "40%",
        backgroundColor: C.ink,
        padding: 48,
        justifyContent: "space-between",
    },
    coverLogoBox: {
        backgroundColor: C.white,
        borderRadius: 6,
        padding: 10,
        width: 110,
        height: 46,
        justifyContent: "center",
        alignItems: "center",
    },
    coverLogo: {
        width: 90,
        height: 30,
        objectFit: "contain",
    },
    coverContent: {
        flex: 1,
        justifyContent: "center",
    },
    coverAccentLine: {
        width: 50,
        height: 3,
        backgroundColor: C.red,
        marginBottom: 24,
    },
    coverEyebrow: {
        fontFamily: F.bold,
        fontSize: 14, // Augmenté
        color: C.red,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 16,
    },
    coverTitle: {
        fontFamily: F.bold,
        fontSize: 36,
        color: C.white,
        lineHeight: 1.2,
        marginBottom: 12,
    },
    coverCampaignName: {
        fontFamily: F.bold,
        fontSize: 20,
        color: C.red,
        marginBottom: 20,
    },
    coverDesc: {
        fontSize: 14, // Augmenté
        color: C.gray400,
        lineHeight: 1.6,
    },
    coverMeta: {
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
        fontSize: 10,
        color: C.gray600,
    },
    coverRight: {
        width: "60%",
        position: "relative",
    },
    coverImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    coverOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: C.ink,
        opacity: 0.4,
    },
    coverTag: {
        position: "absolute",
        bottom: 30,
        left: 30,
        backgroundColor: C.red,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 3,
    },
    coverTagText: {
        fontFamily: F.bold,
        fontSize: 12, // Augmenté
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 2,
    },

    // ----- STATS -----
    statsRow: {
        flexDirection: "row",
        gap: 20,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: C.offwhite,
        borderRadius: 8,
        padding: 24,
        borderWidth: 1,
        borderColor: C.gray200,
    },
    statCardAccent: {
        backgroundColor: C.ink,
        borderColor: C.ink,
    },
    statValue: {
        fontFamily: F.bold,
        fontSize: 48,
        color: C.ink,
        lineHeight: 1,
        marginBottom: 8,
    },
    statValueLight: {
        color: C.white,
    },
    statLabel: {
        fontSize: 12, // Augmenté
        color: C.gray600,
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },
    statLabelLight: {
        color: C.gray400,
    },
    statSmallRow: {
        flexDirection: "row",
        gap: 20,
    },
    statSmallCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: C.gray200,
        borderRadius: 8,
    },
    statSmallBar: {
        width: 3,
        height: 40,
        backgroundColor: C.red,
        borderRadius: 2,
    },
    statSmallValue: {
        fontFamily: F.bold,
        fontSize: 22,
        color: C.ink,
        marginBottom: 4,
    },
    statSmallLabel: {
        fontSize: 10,
        color: C.gray400,
        textTransform: "uppercase",
        letterSpacing: 1,
    },

    // ----- TABLEAU -----
    tableContainer: {
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: C.gray200,
    },
    tableHeader: {
        backgroundColor: C.ink,
        paddingVertical: 10,
        alignItems: "center",
    },
    tableHeaderText: {
        fontFamily: F.bold,
        fontSize: 12, // Augmenté
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    tableRow: {
        flexDirection: "row",
    },
    tableCell: {
        flex: 1,
        height: 36, // Augmenté pour plus d'espace
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: C.gray200,
    },
    tableCellAlt: {
        backgroundColor: C.offwhite,
    },
    tableCellMissing: {
        backgroundColor: C.redLight,
    },
    tableCellText: {
        fontFamily: F.bold,
        fontSize: 12, // Augmenté
        color: C.ink,
    },
    tableCellTextMissing: {
        color: C.red,
    },
    tableNote: {
        marginTop: 20,
        padding: 16,
        backgroundColor: C.offwhite,
        borderLeftWidth: 4,
        borderLeftColor: C.red,
        borderRadius: 4,
    },
    tableNoteText: {
        fontSize: 12, // Augmenté
        color: C.gray600,
        lineHeight: 1.6,
    },

    // ----- DIVIDER -----
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
        padding: 52,
    },
    dividerNumber: {
        fontFamily: F.bold,
        fontSize: 140,
        color: C.white,
        opacity: 0.1,
        position: "absolute",
        top: 20,
        left: 30,
    },
    dividerEyebrow: {
        fontFamily: F.bold,
        fontSize: 14, // Augmenté
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 4,
        opacity: 0.7,
        marginBottom: 20,
    },
    dividerTitle: {
        fontFamily: F.bold,
        fontSize: 44,
        color: C.white,
        lineHeight: 1.1,
    },
    dividerSub: {
        fontSize: 14, // Augmenté
        color: C.white,
        opacity: 0.5,
        marginTop: 20,
        lineHeight: 1.6,
    },
    dividerList: {
        marginTop: 30,
    },
    dividerListItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    dividerListDot: {
        width: 20,
        height: 1,
        backgroundColor: C.red,
    },
    dividerListText: {
        fontSize: 12, // Augmenté
        color: C.gray400,
        flex: 1,
    },

    // ----- PHOTO GRID -----
    photoGrid: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    photoCard: {
        width: "45%",
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: C.gray200,
        backgroundColor: C.white,
    },
    photoImage: {
        width: "100%",
        height: 200, // Augmenté pour plus de visibilité
        objectFit: "cover",
    },
    photoCaption: {
        backgroundColor: C.ink,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    photoCaptionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: C.red,
    },
    photoCaptionLabel: {
        fontSize: 10,
        color: C.gray400,
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },
    photoCaptionValue: {
        fontFamily: F.bold,
        fontSize: 14, // Augmenté
        color: C.white,
    },

    // ----- CONCLUSION -----
    conclusionPage: {
        flex: 1,
        flexDirection: "row",
    },
    conclusionLeft: {
        flex: 1,
        backgroundColor: C.ink,
        padding: 60,
        justifyContent: "center", // Centré verticalement
        alignItems: "center", // Centré horizontalement
    },
    conclusionRight: {
        width: "35%",
        backgroundColor: C.red,
        padding: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    conclusionEyebrow: {
        fontFamily: F.bold,
        fontSize: 14, // Augmenté
        color: C.red,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 20,
        textAlign: "center", // Centré
    },
    conclusionTitle: {
        fontFamily: F.bold,
        fontSize: 32,
        color: C.white,
        lineHeight: 1.3,
        marginBottom: 24,
        textAlign: "center", // Centré
    },
    conclusionBody: {
        fontSize: 14, // Augmenté
        color: C.gray200,
        lineHeight: 1.8,
        textAlign: "center", // Centré
        maxWidth: "85%",
    },
    conclusionLogo: {
        width: 100,
        height: 32,
        objectFit: "contain",
        marginTop: 20,
    },
    contactSection: {
        width: "100%",
        alignItems: "center", // Centré
    },
    contactTitle: {
        fontFamily: F.bold,
        fontSize: 14, // Augmenté
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 30,
        textAlign: "center", // Centré
    },
    contactItem: {
        marginBottom: 24,
        alignItems: "center", // Centré
    },
    contactLabel: {
        fontSize: 10,
        color: C.white,
        opacity: 0.6,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    contactValue: {
        fontFamily: F.bold,
        fontSize: 16, // Augmenté
        color: C.white,
    },
    conclusionTagline: {
        fontSize: 12, // Augmenté
        color: C.white,
        opacity: 0.4,
        fontFamily: F.obl,
        marginTop: 20,
        textAlign: "center", // Centré
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
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return String(d);
    }
};

// ============================================================
// COMPOSANTS PARTAGÉS (inchangés)
// ============================================================
const Header = ({ title }: { title: string }) => (
    <View style={S.header} fixed>
        <View style={S.headerLeft}>
            <View style={S.headerAccent} />
            <View>
                <Text style={S.headerTitle}>{title}</Text>
                <Text style={S.headerSub}>ReseauPub — Rapport Campagne</Text>
            </View>
        </View>
        <Image src={IMG_LOGO_MIXTE} style={S.headerLogo} />
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
// 1. PAGE DE COUVERTURE (inchangée)
// ============================================================
const CoverSlide = ({ campagneNom }: { campagneNom: string }) => (
    <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.coverPage}>
            <View style={S.coverLeft}>
                <View style={S.coverLogoBox}>
                    <Image src={IMG_LOGO_MIXTE} style={S.coverLogo} />
                </View>
                <View style={S.coverContent}>
                    <View style={S.coverAccentLine} />
                    <Text style={S.coverEyebrow}>Rapport de campagne</Text>
                    <Text style={S.coverTitle}>Tricycles</Text>
                    <Text style={S.coverCampaignName}>{campagneNom}</Text>
                    <Text style={S.coverDesc}>
                        Récapitulatif des déploiements, statistiques et preuves visuelles.
                    </Text>
                </View>
                <View style={S.coverMeta}>
                    <View style={S.coverMetaDot} />
                    <Text style={S.coverMetaText}>
                        Généré le {new Date().toLocaleDateString("fr-FR")}
                    </Text>
                </View>
            </View>
            <View style={S.coverRight}>
                <Image src={IMG_TRICYCLES} style={S.coverImage} />
                <View style={S.coverOverlay} />
                <View style={S.coverTag}>
                    <Text style={S.coverTagText}>Campagne terrain</Text>
                </View>
            </View>
        </View>
    </Page>
);

// ============================================================
// 2. STATISTIQUES (inchangé)
// ============================================================
const StatsSlide = ({ data }: { data: ReportData }) => (
    <Page size="A4" orientation="landscape" style={S.page}>
        <Header title="Statistiques globales" />
        <View style={S.body}>
            <Text style={S.sectionTitle}>Vue d'ensemble</Text>
            <View style={S.statsRow}>
                <View style={S.statCard}>
                    <Text style={S.statValue}>{data.kpis.nbPrestatairesCible ?? "—"}</Text>
                    <Text style={S.statLabel}>Tricycles demandés</Text>
                </View>
                <View style={[S.statCard, S.statCardAccent]}>
                    <Text style={[S.statValue, S.statValueLight]}>{data.kpis.totalPrestataires}</Text>
                    <Text style={[S.statLabel, S.statLabelLight]}>Panneaux affichés</Text>
                </View>
            </View>
            <View style={S.statSmallRow}>
                <View style={S.statSmallCard}>
                    <View style={S.statSmallBar} />
                    <View>
                        <Text style={S.statSmallValue}>{fmt(data.campagne.dateDebut)}</Text>
                        <Text style={S.statSmallLabel}>Date de démarrage</Text>
                    </View>
                </View>
                <View style={S.statSmallCard}>
                    <View style={S.statSmallBar} />
                    <View>
                        <Text style={S.statSmallValue}>{data.kpis.dureejours ?? "—"} jrs</Text>
                        <Text style={S.statSmallLabel}>Durée</Text>
                    </View>
                </View>
                <View style={S.statSmallCard}>
                    <View style={S.statSmallBar} />
                    <View>
                        <Text style={S.statSmallValue}>{fmt(data.campagne.dateFin)}</Text>
                        <Text style={S.statSmallLabel}>Fin de campagne</Text>
                    </View>
                </View>
            </View>
        </View>
        <Footer />
    </Page>
);

// ============================================================
// 3. RÉCAPITULATIF DES PLAQUES (inchangé)
// ============================================================
const RecapPlaquesSlide = ({ prestataires }: { prestataires: ReportData["prestataires"] }) => {
    const sansPlaqueCount = prestataires.filter(
        (p) => !p.plaque || p.plaque.trim() === ""
    ).length;

    const MAX_ROWS = 12;
    const CELLS_PER_PAGE = 6 * MAX_ROWS;
    const pages: ReportData["prestataires"][] = [];
    for (let i = 0; i < prestataires.length; i += CELLS_PER_PAGE) {
        pages.push(prestataires.slice(i, i + CELLS_PER_PAGE));
    }
    if (pages.length === 0) pages.push([]);

    return (
        <>
            {pages.map((pageData, pageIdx) => {
                const rows: ReportData["prestataires"][] = [];
                for (let i = 0; i < pageData.length; i += 6) {
                    rows.push(pageData.slice(i, i + 6));
                }

                return (
                    <Page key={pageIdx} size="A4" orientation="landscape" style={S.page}>
                        <Header title="Numéros matricules" />
                        <View style={S.body}>
                            <Text style={S.sectionTitle}>
                                Récapitulatif des {prestataires.length} tricycles
                            </Text>
                            <View style={S.tableContainer}>
                                <View style={S.tableHeader}>
                                    <Text style={S.tableHeaderText}>Numéros d'immatriculation</Text>
                                </View>
                                {rows.map((row, rIdx) => (
                                    <View key={rIdx} style={S.tableRow}>
                                        {row.map((p, cIdx) => {
                                            const hasPlaque = p.plaque && p.plaque.trim().length > 0;
                                            const isAlt = rIdx % 2 === 1;
                                            const globalIndex = pageIdx * CELLS_PER_PAGE + rIdx * 6 + cIdx + 1;
                                            return (
                                                <View
                                                    key={cIdx}
                                                    style={[
                                                        S.tableCell,
                                                        isAlt && S.tableCellAlt,
                                                        !hasPlaque && S.tableCellMissing,
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            S.tableCellText,
                                                            !hasPlaque && S.tableCellTextMissing,
                                                        ]}
                                                    >
                                                        {globalIndex}. {hasPlaque ? p.plaque : "—"}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                        {Array.from({ length: 6 - row.length }).map((_, i) => (
                                            <View
                                                key={`empty-${i}`}
                                                style={[S.tableCell, rIdx % 2 === 1 && S.tableCellAlt]}
                                            />
                                        ))}
                                    </View>
                                ))}
                            </View>
                            {pageIdx === pages.length - 1 && (
                                <View style={S.tableNote}>
                                    <Text style={S.tableNoteText}>
                                        <Text style={{ fontFamily: F.bold }}>Note : </Text>
                                        {prestataires.length} tricycles déployés.
                                        {sansPlaqueCount > 0
                                            ? ` ${sansPlaqueCount} sans numéro (signalés par « — »).`
                                            : " Toutes les plaques sont renseignées."}
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
// 4. INTERCALAIRE ALBUM (inchangé)
// ============================================================
const AlbumDividerSlide = () => (
    <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.dividerPage}>
            <View style={S.dividerLeft}>
                <Text style={S.dividerNumber}>04</Text>
                <View>
                    <Text style={S.dividerEyebrow}>Section suivante</Text>
                    <Text style={S.dividerTitle}>Album{"\n"}Photos</Text>
                    <Text style={S.dividerSub}>Preuves visuelles de déploiement terrain.</Text>
                </View>
            </View>
            <View style={S.dividerRight}>
                <Text style={[S.dividerEyebrow, { opacity: 0.8 }]}>Au programme</Text>
                <View style={S.dividerList}>
                    {[
                        "Photos de déploiement sur le terrain",
                        "Numéros matricule associés",
                        "Couverture visuelle complète",
                    ].map((item, i) => (
                        <View key={i} style={S.dividerListItem}>
                            <View style={S.dividerListDot} />
                            <Text style={S.dividerListText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    </Page>
);

// ============================================================
// 5. ALBUM PHOTO (disposition diagonale corrigée)
// ============================================================
const VisualEvidenceSlide = ({
    visualEvidence,
}: {
    visualEvidence: ReportData["visualEvidence"];
}) => {
    if (visualEvidence.length === 0) return null;

    const groups: ReportData["visualEvidence"][] = [];
    for (let i = 0; i < visualEvidence.length; i += 2) {
        groups.push(visualEvidence.slice(i, i + 2));
    }

    return (
        <>
            {groups.map((group, pageIdx) => (
                <Page key={pageIdx} size="A4" orientation="landscape" style={S.page}>
                    <Header title="Preuves visuelles" />
                    <View style={[S.body, { justifyContent: "center" }]}>
                        <View style={S.photoGrid}>
                            {group.map((photo, idx) => {
                                // Positionnement diagonal
                                const positionStyle =
                                    group.length === 1
                                        ? { alignSelf: "center" }
                                        : idx === 0
                                            ? { alignSelf: "flex-start", marginTop: 20 }
                                            : { alignSelf: "flex-end", marginBottom: 20 };
                                return (
                                    <View key={idx} style={[S.photoCard, positionStyle]}>
                                        <Image src={photo.url} style={S.photoImage} />
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
                                );
                            })}
                        </View>
                    </View>
                    <Footer />
                </Page>
            ))}
        </>
    );
};

// ============================================================
// 6. CONCLUSION (centrage corrigé)
// ============================================================
const ConclusionSlide = () => (
    <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.conclusionPage}>
            <View style={S.conclusionLeft}>
                <View style={{ alignItems: "center" }}>
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
                <Image src={IMG_LOGO_MIXTE} style={S.conclusionLogo} />
            </View>
            <View style={S.conclusionRight}>
                <View style={S.contactSection}>
                    <Text style={S.contactTitle}>Nous contacter</Text>
                    <View style={S.contactItem}>
                        <Text style={S.contactLabel}>Téléphone</Text>
                        <Text style={S.contactValue}>+229 01 69 81 30 30</Text>
                    </View>
                    <View style={S.contactItem}>
                        <Text style={S.contactLabel}>Email</Text>
                        <Text style={S.contactValue}>info@reseaupub.com</Text>
                    </View>
                </View>
                <Text style={S.conclusionTagline}>La communication, c'est notre terrain.</Text>
            </View>
        </View>
    </Page>
);

// ============================================================
// COMPOSANT PRINCIPAL (inchangé)
// ============================================================
export default function CampaignReport({ data }: { data: ReportData }) {
    const enhancedVisualEvidence = data.visualEvidence.map((ve) => {
        const prest = data.prestataires.find(
            (p) => `${p.prenom} ${p.nom}`.trim() === ve.prestataire
        );
        return { ...ve, plaque: ve.plaque || prest?.plaque || null };
    });

    return (
        <Document title={`RAPPORT_CAMPAGNE_TRICYCLES_${data.campagne.nom ?? ""}`} author="RESEAUPUB">
            <CoverSlide campagneNom={data.campagne.nom ?? ""} />
            <StatsSlide data={data} />
            <RecapPlaquesSlide prestataires={data.prestataires} />
            <AlbumDividerSlide />
            <VisualEvidenceSlide visualEvidence={enhancedVisualEvidence} />
            <ConclusionSlide />
        </Document>
    );
}
