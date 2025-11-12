"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FormData = {
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string;
  senha: string;
  confirmSenha: string;
  cep: string; // formato 00000-000 ou apenas dígitos
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string; // UF
  cpf: string;
  dataNascimento?: string; // dd/mm/aaaa
};

function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

function formatCEP(s: string): string {
  const d = onlyDigits(s).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function formatCPF(s: string): string {
  const d = onlyDigits(s).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  let out = p1;
  if (p2) out += `.${p2}`;
  if (p3) out += `.${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

function formatDateBR(s: string): string {
  const d = onlyDigits(s).slice(0, 8);
  const dd = d.slice(0, 2);
  const mm = d.slice(2, 4);
  const yyyy = d.slice(4, 8);
  let out = dd;
  if (mm) out += `/${mm}`;
  if (yyyy) out += `/${yyyy}`;
  return out;
}

function isValidDateBR(s: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || "");
  if (!m) return false;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12) return false;
  const maxDays = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > maxDays) return false;
  const nowYear = new Date().getFullYear();
  if (yyyy < 1900 || yyyy > nowYear) return false;
  return true;
}

function toISOFromBRDate(s?: string): string | undefined {
  if (!s) return undefined;
  if (!isValidDateBR(s)) return undefined;
  const [dd, mm, yyyy] = s.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function formatPhone(s: string): string {
  const d = onlyDigits(s).slice(0, 11);
  const area = d.slice(0, 2);
  const isMobile = d.length > 10;
  const first = isMobile ? d.slice(2, 7) : d.slice(2, 6);
  const last = isMobile ? d.slice(7, 11) : d.slice(6, 10);
  let out = "";
  if (area) out += `(${area})`;
  if (first) out += ` ${first}`;
  if (last) out += `-${last}`;
  return out;
}

function isValidCPF(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]);
}

const schema = z
  .object({
    nome: z.string().min(2, "Informe seu nome"),
    sobrenome: z.string().min(2, "Informe seu sobrenome"),
    email: z.string().email("Email inválido"),
    telefone: z
      .string()
      .optional()
      .refine(
        (v) => !v || onlyDigits(v).length === 10 || onlyDigits(v).length === 11,
        "Telefone deve ter 10 ou 11 dígitos"
      ),
    senha: z.string().min(6, "Senha mínima de 6 caracteres"),
    confirmSenha: z.string().min(6, "Confirme sua senha"),
    cep: z
      .string()
      .refine((v) => onlyDigits(v).length === 8, "CEP deve ter 8 dígitos"),
    endereco: z.string().min(3, "Endereço é obrigatório"),
    // número da residência apenas dígitos
    numero: z
      .string()
      .min(1, "Número é obrigatório")
      .refine((v) => /^\d+$/.test(v), "Número deve ser inteiro"),
    bairro: z.string().min(2, "Bairro é obrigatório"),
    cidade: z.string().min(2, "Cidade é obrigatória"),
    estado: z
      .string()
      .transform((v) => v.toUpperCase())
      .refine((v) => /^[A-Z]{2}$/.test(v), "UF deve ter 2 letras"),
    cpf: z.string().refine(isValidCPF, "CPF inválido"),
    dataNascimento: z
      .string()
      .optional()
      .refine((v) => !v || isValidDateBR(v), "Data de nascimento inválida"),
  })
  .refine((data) => data.senha === data.confirmSenha, {
    path: ["confirmSenha"],
    message: "As senhas não coincidem",
  });

export default function CadastroClientePage() {
  const numeroRef = useRef<HTMLInputElement | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      sobrenome: "",
      email: "",
      telefone: "",
      senha: "",
      confirmSenha: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cpf: "",
      dataNascimento: "",
    },
  });

  const numeroReg = register("numero");

  const cepVal = watch("cep");
  const cpfVal = watch("cpf");
  const telVal = watch("telefone");
  const birthVal = watch("dataNascimento");

  useEffect(() => {
    // formata CEP conforme digitação
    setValue("cep", formatCEP(cepVal || ""), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepVal]);

  useEffect(() => {
    // formata CPF conforme digitação
    setValue("cpf", formatCPF(cpfVal || ""), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpfVal]);

  useEffect(() => {
    // formata Telefone conforme digitação
    setValue("telefone", formatPhone(telVal || ""), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telVal]);

  useEffect(() => {
    // formata Data de nascimento conforme digitação
    setValue("dataNascimento", formatDateBR(birthVal || ""), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthVal]);

  async function lookupCEP() {
    const digits = onlyDigits(cepVal || "");
    if (digits.length !== 8) return;
    setCepError(null);
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        setCepError("CEP não encontrado");
      } else {
        setValue("endereco", data.logradouro || "");
        setValue("complemento", data.complemento || "");
        setValue("bairro", data.bairro || "");
        setValue("cidade", data.localidade || "");
        setValue("estado", (data.uf || "").toUpperCase());
        // foca no número após preencher auto
        numeroRef.current?.focus();
      }
    } catch {
      setCepError("Falha ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  }

  async function onSubmit(values: FormData) {
    const raw = getValues();
    const nomeCompleto = `${(values.nome || "").trim()} ${(values.sobrenome || "").trim()}`.trim();
    const { confirmSenha, ...base } = values;
    const payload = {
      ...base,
      nome: nomeCompleto,
      complemento: raw.complemento,
      cep: onlyDigits(values.cep),
      cpf: onlyDigits(values.cpf),
      telefone: onlyDigits(values.telefone || ""),
      estado: values.estado.toUpperCase(),
      data_nascimento: toISOFromBRDate(values.dataNascimento || ""),
    };
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Cadastro realizado com sucesso! Faça login para continuar.");
      window.location.href = "/loja";
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d?.detail || "Falha ao cadastrar");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-primary p-4 text-black">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-lg font-semibold">Cadastro de Cliente</h1>
          <p className="text-xs">Preencha primeiro o CEP para auto-completar o endereço.</p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm">Nome</label>
              <Input {...register("nome")} placeholder="Seu nome" />
              {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Sobrenome</label>
              <Input {...register("sobrenome")} placeholder="Seu sobrenome" />
              {errors.sobrenome && <p className="mt-1 text-xs text-red-600">{errors.sobrenome.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Email</label>
              <Input type="email" {...register("email")} placeholder="voce@exemplo.com" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Senha</label>
              <Input type="password" {...register("senha")} placeholder="••••••••" />
              {errors.senha && <p className="mt-1 text-xs text-red-600">{errors.senha.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Confirmar senha</label>
              <Input type="password" {...register("confirmSenha")} placeholder="••••••••" />
              {errors.confirmSenha && <p className="mt-1 text-xs text-red-600">{errors.confirmSenha.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm">Telefone</label>
              <Input {...register("telefone")} placeholder="(99) 99999-9999" />
              {errors.telefone && <p className="mt-1 text-xs text-red-600">{errors.telefone.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">CEP</label>
              <Input
                {...register("cep")}
                placeholder="00000-000"
                onBlur={lookupCEP}
              />
              {cepLoading && <p className="mt-1 text-xs text-zinc-600">Buscando endereço...</p>}
              {(errors.cep || cepError) && (
                <p className="mt-1 text-xs text-red-600">{errors.cep?.message || cepError}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm">Endereço</label>
              <Input {...register("endereco")} placeholder="Rua Exemplo" />
              {errors.endereco && <p className="mt-1 text-xs text-red-600">{errors.endereco.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Número</label>
              <Input
                {...numeroReg}
                ref={(el) => {
                  numeroReg.ref(el);
                  numeroRef.current = el;
                }}
                placeholder="123"
              />
              {errors.numero && <p className="mt-1 text-xs text-red-600">{errors.numero.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm">Complemento</label>
              <Input {...register("complemento")} placeholder="Apto, bloco, etc." />
            </div>
            <div>
              <label className="mb-1 block text-sm">Bairro</label>
              <Input {...register("bairro")} placeholder="Centro" />
              {errors.bairro && <p className="mt-1 text-xs text-red-600">{errors.bairro.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Cidade</label>
              <Input {...register("cidade")} placeholder="São Paulo" />
              {errors.cidade && <p className="mt-1 text-xs text-red-600">{errors.cidade.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Estado (UF)</label>
              <Input {...register("estado")} placeholder="SP" />
              {errors.estado && <p className="mt-1 text-xs text-red-600">{errors.estado.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-sm">CPF</label>
              <Input {...register("cpf")} placeholder="000.000.000-00" />
              {errors.cpf && <p className="mt-1 text-xs text-red-600">{errors.cpf.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Data de nascimento</label>
              <Input {...register("dataNascimento")} placeholder="dd/mm/aaaa" />
              {errors.dataNascimento && (
                <p className="mt-1 text-xs text-red-600">{errors.dataNascimento.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button className="bg-primary text-black" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}