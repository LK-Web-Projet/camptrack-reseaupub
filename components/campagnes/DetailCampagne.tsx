"use client";

import { ArrowLeft, Megaphone, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

interface Client {
	id_client?: string;
	nom?: string;
	prenom?: string;
	entreprise?: string | null;
	contact?: string | null;
	mail?: string | null;
}

interface Lieu {
	id_lieu?: string;
	nom?: string;
	ville?: string;
}

interface Service {
	id_service?: string;
	nom?: string;
	description?: string | null;
}

interface Gestionnaire {
	id_user?: string;
	nom?: string;
	prenom?: string;
	email?: string;
}

interface Affectation {
	prestataire: {
		id_prestataire: string;
		nom?: string;
		prenom?: string;
		contact?: string;
	};
	date_creation?: string;
	status?: string;
}

interface Fichier {
	id_fichier: string;
	nom_fichier?: string;
	description?: string | null;
	type_fichier?: string | null;
	date_creation?: string;
}

interface PrestataireListItem {
	id_prestataire: string;
	nom?: string;
	prenom?: string;
	contact?: string | null;
	service?: { nom?: string } | null;
}

interface Campagne {
	id_campagne: string;
	nom_campagne?: string;
	description?: string | null;
	objectif?: string | null;
	quantite_service?: number | null;
	nbr_prestataire?: number | null;
	type_campagne?: string | null;
	date_debut?: string | null;
	date_fin?: string | null;
	status?: string | null;
	date_creation?: string | null;
	updated_at?: string | null;
	client?: Client | null;
	lieu?: Lieu | null;
	service?: Service | null;
	gestionnaire?: Gestionnaire | null;
	affectations?: Affectation[] | null;
	fichiers?: Fichier[] | null;
	_count?: { affectations?: number; fichiers?: number; dommages?: number };
}

export default function DetailCampagne({ id }: { id: string }) {
	const { token } = useAuth();
	const [campagne, setCampagne] = useState<Campagne | null>(null);
	const [loading, setLoading] = useState(true);
	// assign prestataire states
		const [showAssign, setShowAssign] = useState(false);
		const [prestataires, setPrestataires] = useState<PrestataireListItem[]>([]);
	const [fetchingPrestataires, setFetchingPrestataires] = useState(false);
	const [selectedPrestataire, setSelectedPrestataire] = useState<string | null>(null);
	const [assignLoading, setAssignLoading] = useState(false);

	useEffect(() => {
		const fetchCampagne = async () => {
			if (!id || !token) return;
			setLoading(true);
			try {
				const res = await fetch(`/api/campagnes/${id}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					throw new Error(body.error || `Erreur ${res.status}`);
				}
				const data = await res.json();
				setCampagne(data.campagne ?? null);
			} catch (err) {
				console.error("Erreur fetch campagne:", err);
				const msg = err instanceof Error ? err.message : "Erreur lors du chargement";
				toast.error(msg);
			} finally {
				setLoading(false);
			}
		};

		fetchCampagne();
	}, [id, token]);

		const fetchPrestataires = async () => {
			if (!token) return;
			setFetchingPrestataires(true);
			try {
				const res = await fetch(`/api/prestataires?limit=200`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) throw new Error(`Erreur ${res.status}`);
				const data = await res.json();
				setPrestataires(data.prestataires || []);
			} catch (err) {
				console.error("Erreur fetch prestataires:", err);
				const msg = err instanceof Error ? err.message : "Erreur lors du chargement des prestataires";
				toast.error(msg);
			} finally {
				setFetchingPrestataires(false);
			}
		};

		const handleAssign = async () => {
			if (!selectedPrestataire || !token) {
				toast.error("Veuillez sélectionner un prestataire");
				return;
			}
			setAssignLoading(true);
			try {
				const res = await fetch(`/api/campagnes/${id}/prestataires`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ id_prestataire: selectedPrestataire }),
				});
				const body = await res.json().catch(() => ({}));
				if (!res.ok) {
					throw new Error(body.error || `Erreur ${res.status}`);
				}

				// API returns { affectation }
				const affectation = body.affectation;
				toast.success(body.message || "Prestataire affecté avec succès");

				// Update local campagne state: prepend new affectation
				setCampagne((prev) => {
					if (!prev) return prev;
					const updated = { ...prev } as Campagne;
					updated.affectations = [affectation, ...(prev.affectations || [])];
					// update counts
					if (updated._count) updated._count.affectations = (updated._count.affectations || 0) + 1;
					return updated;
				});

				// reset assign UI
				setSelectedPrestataire(null);
				setShowAssign(false);
			} catch (err) {
				console.error("Erreur assign prestataire:", err);
				const msg = err instanceof Error ? err.message : "Erreur lors de l'affectation";
				toast.error(msg);
			} finally {
				setAssignLoading(false);
			}
		};

	if (loading) {
		return (
			 <div className="flex flex-col items-center justify-center py-10">
    <div className="w-10 h-10 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-300 font-medium">
      Chargement des détails de la campagne...
    </p>
  </div>
		);
	}

	if (!campagne) {
		return (
			<div className="p-6">
				<Link href="/dashboard/campagnes">
					<button className="flex items-center  gap-2 text-[#d61353] hover:text-[#b01044] mb-6">
						<ArrowLeft className="w-5 h-5 cursor-pointer" />
						Retour
					</button>
				</Link>
				<div className="flex items-center justify-center h-96 bg-white dark:bg-gray-900 rounded-lg shadow">
					<p className="text-gray-500">Campagne non trouvée</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 text-gray-900 dark:text-white">
			<div className="flex items-center gap-4 mb-6">
				<Link href="/dashboard/campagnes">
					<button className="flex items-center gap-2 text-[#d61353] hover:text-[#b01044] transition">
						<ArrowLeft className="w-5 h-5" />
						Retour
					</button>
				</Link>
				<div className="flex items-center gap-2 text-[#d61353]">
					<Megaphone className="w-6 h-6" />
					<h1 className="text-2xl font-bold">{campagne.nom_campagne}</h1>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
					<h2 className="text-lg font-bold text-[#d61353] mb-4">Informations générales</h2>
					<div className="space-y-2 text-sm">
						<p><strong>ID:</strong> <span className="font-mono">{campagne.id_campagne}</span></p>
						<p><strong>Nom:</strong> {campagne.nom_campagne ?? '-'}</p>
						<p><strong>Description:</strong> {campagne.description ?? '-'}</p>
						<p><strong>Objectif:</strong> {campagne.objectif ?? '-'}</p>
						<p><strong>Type:</strong> {campagne.type_campagne ?? '-'}</p>
						<p><strong>Date début:</strong> {campagne.date_debut ? new Date(campagne.date_debut).toLocaleDateString('fr-FR') : '-'}</p>
						<p><strong>Date fin:</strong> {campagne.date_fin ? new Date(campagne.date_fin).toLocaleDateString('fr-FR') : '-'}</p>
						<p><strong>Status:</strong> {campagne.status ?? '-'}</p>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
					<h2 className="text-lg font-bold text-[#d61353] mb-4">Infos système</h2>
					<div className="space-y-2 text-sm">
						<p><strong>Date de création:</strong> {campagne.date_creation ?? '-'}</p>
						<p><strong>Dernière mise à jour:</strong> {campagne.updated_at ?? '-'}</p>
						<p><strong>Nb. prestataires:</strong> {campagne.nbr_prestataire ?? '-'}</p>
						<p><strong>Quantité service:</strong> {campagne.quantite_service ?? '-'}</p>
						<p><strong>Counts:</strong> Affectations: {campagne._count?.affectations ?? 0} — Fichiers: {campagne._count?.fichiers ?? 0} — Dommages: {campagne._count?.dommages ?? 0}</p>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6 lg:col-span-2">
					<h2 className="text-lg font-bold text-[#d61353] mb-4">Client</h2>
					<p><strong>Nom:</strong> {campagne.client?.nom ?? '-'} {campagne.client?.prenom ?? ''}</p>
					<p><strong>Entreprise:</strong> {campagne.client?.entreprise ?? '-'}</p>
					<p><strong>Contact:</strong> {campagne.client?.contact ?? '-'}</p>
					<p><strong>Email:</strong> {campagne.client?.mail ?? '-'}</p>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
					<h2 className="text-lg font-bold text-[#d61353] mb-4">Lieu</h2>
					<p><strong>Nom:</strong> {campagne.lieu?.nom ?? '-'}</p>
					<p><strong>Ville:</strong> {campagne.lieu?.ville ?? '-'}</p>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6">
					<h2 className="text-lg font-bold text-[#d61353] mb-4">Gestionnaire</h2>
					<p><strong>Nom:</strong> {campagne.gestionnaire ? `${campagne.gestionnaire.nom ?? ''} ${campagne.gestionnaire.prenom ?? ''}` : '-'}</p>
					<p><strong>Email:</strong> {campagne.gestionnaire?.email ?? '-'}</p>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6 lg:col-span-2">
					<h2 className="text-lg font-bold text-[#d61353] mb-4">Service</h2>
					<p><strong>Nom:</strong> {campagne.service?.nom ?? '-'}</p>
					<p><strong>Description:</strong> {campagne.service?.description ?? '-'}</p>
				</div>

						{/* Prestataires assignés & assignation */}
							<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6 lg:col-span-2">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-lg font-bold text-[#d61353]">Prestataires assignés</h2>
									<div className="flex items-center gap-2">
										<button
											onClick={async () => {
												// toggle assign panel; fetch prestataires when opening
												if (!showAssign) await fetchPrestataires();
												setShowAssign(!showAssign);
											}}
											className="px-3 py-1 text-sm rounded bg-[#d61353] text-white hover:bg-[#b01044]"
										>
											{showAssign ? 'Annuler' : 'Assigner un prestataire'}
										</button>
									</div>
								</div>

								{showAssign && (
									<div className="mb-4">
										{fetchingPrestataires ? (
											<div className="text-sm text-gray-500">Chargement des prestataires...</div>
										) : (
											<div className="flex gap-2">
												<select
													value={selectedPrestataire ?? ""}
													onChange={(e) => setSelectedPrestataire(e.target.value || null)}
													className="border p-2 rounded flex-1"
												>
													<option value="">-- Sélectionner un prestataire --</option>
																		{prestataires.map((p: PrestataireListItem) => (
																			<option key={p.id_prestataire} value={p.id_prestataire}>
																				{p.nom} {p.prenom} {p.service?.nom ? `— ${p.service.nom}` : ''}
																			</option>
																		))}
												</select>
												<button
													onClick={handleAssign}
													disabled={assignLoading}
													className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-60"
												>
													{assignLoading ? 'Assignation...' : 'Assigner'}
												</button>
											</div>
										)}
									</div>
								)}

								{campagne.affectations && campagne.affectations.length > 0 ? (
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b border-gray-200 dark:border-gray-700">
													<th className="text-left py-2 px-2 font-semibold">Prestataire</th>
													<th className="text-left py-2 px-2 font-semibold">Date</th>
													<th className="text-left py-2 px-2 font-semibold">Status</th>
													<th className="text-left py-2 px-2 font-semibold">Actions</th>
												</tr>
											</thead>
											<tbody>
												{campagne.affectations.map((a, idx) => (
													<tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
														<td className="py-3 px-2">{a.prestataire?.nom ?? '-'} {a.prestataire?.prenom ?? ''} <div className="text-xs text-gray-500">{a.prestataire?.service?.nom ?? ''}</div></td>
														<td className="py-3 px-2">{a.date_creation ? new Date(a.date_creation).toLocaleDateString('fr-FR') : '-'}</td>
														<td className="py-3 px-2">{a.status ?? '-'}</td>
														<td className="py-3 px-2">
															<div className="flex gap-2">
																<Link href={`/dashboard/prestataires/${a.prestataire?.id_prestataire}`} className="text-sm px-2 py-1 bg-gray-100 rounded">Voir</Link>
																<Link href={`/dashboard/prestataires/${a.prestataire?.id_prestataire}`} className="text-sm px-2 py-1 bg-blue-50 rounded">Vérification matérielle</Link>
															</div>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : (
									<p className="text-gray-500">Aucun prestataire assigné</p>
								)}
							</div>

				{/* Fichiers */}
				<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 p-6 lg:col-span-2">
					<h2 className="text-lg font-bold text-[#d61353] mb-4">Fichiers</h2>
					{campagne.fichiers && campagne.fichiers.length > 0 ? (
						<div className="space-y-3">
							{campagne.fichiers.map((f) => (
								<div key={f.id_fichier} className="flex items-center justify-between border p-3 rounded">
									<div className="flex items-center gap-3">
										<FileText className="w-5 h-5 text-gray-500" />
										<div>
											<div className="font-medium">{f.nom_fichier ?? 'Fichier'}</div>
											<div className="text-xs text-gray-500">{f.description ?? ''}</div>
										</div>
									</div>
									<div className="text-sm text-gray-500">{f.date_creation ? new Date(f.date_creation).toLocaleDateString('fr-FR') : ''}</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-gray-500">Aucun fichier associé</p>
					)}
				</div>
			</div>
		</div>
	);
}
