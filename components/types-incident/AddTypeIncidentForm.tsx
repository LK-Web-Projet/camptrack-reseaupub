"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Loader2 } from "lucide-react";

interface TypeIncident {
    id_type_incident: string;
    nom: string;
    description: string | null;
    created_at: string;
}

export default function AddTypeIncidentForm() {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [typeIncidents, setTypeIncidents] = useState<TypeIncident[]>([]);

    // Form states
    const [nom, setNom] = useState("");
    const [description, setDescription] = useState("");

    const fetchTypeIncidents = async () => {
        setLoading(true);
        try {
            const res = await apiClient("/api/types-incidents");
            if (res.ok) {
                const data = await res.json();
                setTypeIncidents(data);
            } else {
                toast.error("Échec du chargement des types d'incident.");
            }
        } catch (error) {
            console.error("Error fetching incident types:", error);
            toast.error("Erreur lors du chargement des types d'incident.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypeIncidents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { nom, description };
            const res = await apiClient("/api/types-incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Erreur lors de la création du type d'incident.");
            }

            toast.success("Type d'incident créé avec succès.");
            setNom("");
            setDescription("");
            fetchTypeIncidents(); // Refresh the list
        } catch (err) {
            console.error("Error creating incident type:", err);
            toast.error(err instanceof Error ? err.message : "Erreur inconnue lors de la création.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-[#d61353]" />
                        Ajouter un Nouveau Type d'Incident
                    </CardTitle>
                    <CardDescription>
                        Définissez de nouveaux types d'incidents pour une meilleure catégorisation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="nom">Nom du Type d'Incident</Label>
                            <Input
                                id="nom"
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                placeholder="Ex: Retard, Panne Véhicule, Attitude Problématique"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="description">Description (Optionnel)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description détaillée de ce type d'incident."
                                rows={3}
                            />
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full bg-[#d61353] hover:bg-[#b01044]">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                "Créer le Type d'Incident"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Types d'Incidents Existants</CardTitle>
                    <CardDescription>
                        Liste de tous les types d'incidents actuellement configurés.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-[#d61353]" />
                        </div>
                    ) : typeIncidents.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Aucun type d'incident enregistré pour le moment.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Date de Création</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {typeIncidents.map((type) => (
                                    <TableRow key={type.id_type_incident}>
                                        <TableCell className="font-medium">{type.nom}</TableCell>
                                        <TableCell>{type.description || "-"}</TableCell>
                                        <TableCell>{new Date(type.created_at).toLocaleDateString('fr-FR')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
