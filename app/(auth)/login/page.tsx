"use client";
import React, { useState } from "react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			if (!res.ok) {
				const data = await res.json();
				setError(data.message || "Erreur de connexion");
			} else {
				// Connexion réussie : rediriger ou stocker le token selon ta logique
				window.location.href = "/dashboard/admin";
			}
		} catch (err) {
			setError("Erreur réseau");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: 400, margin: "auto", padding: 32 }}>
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
				{error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
				<button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
					{loading ? "Connexion..." : "Se connecter"}
				</button>
			</form>
		</div>
	);
}
