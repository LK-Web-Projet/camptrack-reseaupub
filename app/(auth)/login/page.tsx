"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
		<div className="max-w-[400px] p-32 m-auto">
			<ToastContainer />
			<h2>Connexion</h2>
			<form onSubmit={handleSubmit}>
				<div className="mb-4">
					<label>Email</label>
					<Input
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
						style={{ width: "100%", padding: 8 }}
					/>
				</div>
				<div className="mb-4">
					<label>Mot de passe</label>
					<Input
						type="password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
						style={{ width: "100%", padding: 8 }}
					/>
				</div>
				<Button type="submit" disabled={loading} className="w-full">
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Connexion...
						</>
					) : (
						"Se connecter"
					)}
				</Button>
			</form>
		</div>
	);
}
