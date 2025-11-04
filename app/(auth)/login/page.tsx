"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const success = await login(email, password);
			if (success) {
				toast.success("Connexion réussie !");
			} else {
				toast.error("Identifiants invalides !");
			}
		} catch {
			toast.error("Erreur lors de la connexion !");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: 400, margin: "auto", padding: 32 }}>
			<ToastContainer />
			<h2>Connexion</h2>
			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: 16 }}>
					<label>Email</label>
					<input
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
						style={{ width: "100%", padding: 8 }}
					/>
				</div>
				<div style={{ marginBottom: 16 }}>
					<label>Mot de passe</label>
					<input
						type="password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
						style={{ width: "100%", padding: 8 }}
					/>
				</div>
						<button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
							{loading ? "Connexion..." : "Se connecter"}
						</button>
			</form>
		</div>
	);
}
