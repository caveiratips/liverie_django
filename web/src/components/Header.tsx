import { Search, ShoppingCart, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="bg-green-800 text-white text-center py-2 text-sm">
        <span>CUPOM DE PRIMEIRA COMPRA: &quot;CHEGUEI&quot;</span>
        <span className="mx-4">|</span>
        <span>4X SEM JUROS PIX PARCELADO</span>
      </div>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button className="text-gray-600">
            <Search className="h-6 w-6" />
          </button>
          <input
            type="text"
            placeholder="O que você procura?"
            className="border-b-2 border-gray-300 focus:border-green-500 outline-none"
          />
        </div>
        <div className="flex-1 flex justify-center">
          <Link href="/">
            <Image
              src="/next.svg"
              alt="LIEBE"
              width={120}
              height={40}
              className="h-10"
            />
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-gray-600">
            <User className="h-6 w-6" />
          </Link>
          <Link href="/carrinho" className="text-gray-600">
            <ShoppingCart className="h-6 w-6" />
          </Link>
        </div>
      </div>
      <nav className="container mx-auto px-4 pb-4 flex justify-center space-x-8 text-sm text-gray-600">
        <Link href="/queridinhos" className="hover:text-green-500">
          QUERIDINHOS
        </Link>
        <Link href="/novidades" className="hover:text-green-500">
          NOVIDADES
        </Link>
        <Link href="/sutia" className="hover:text-green-500">
          SUTIÃ
        </Link>
        <Link href="/calcinha" className="hover:text-green-500">
          CALCINHA
        </Link>
        <Link href="/body" className="hover:text-green-500">
          BODY
        </Link>
        <Link href="/modelador" className="hover:text-green-500">
          MODELADOR
        </Link>
        <Link href="/acessorios" className="hover:text-green-500">
          ACESSÓRIOS
        </Link>
        <Link href="/linha-noite" className="hover:text-green-500">
          LINHA NOITE
        </Link>
        <Link href="/plus" className="hover:text-green-500">
          PLUS
        </Link>
        <Link href="/black-sale" className="hover:text-green-500">
          BLACK SALE
        </Link>
      </nav>
    </header>
  )
}