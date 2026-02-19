"use client";
import * as React from "react"
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Megaphone,
  Briefcase,
  Users,
  UserRound,
  MapPin,
  CreditCard,
  Archive,
} from "lucide-react"

// import { SearchForm } from "@/components/search-form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// import { useIsMobile } from "@/hooks/use-mobile"
import { Logo } from "./ui/logo"

const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Tableau de bord",
      icon: LayoutDashboard,
      items: [{ title: "Tableau de bord", url: "/dashboard/admin" }],
    },
    {
      title: "Gestion des utilisateurs",
      icon: LayoutDashboard,
      items: [{ title: "Gestion des utilisateurs", url: "/dashboard/users" }],
    },
    {
      title: "Clients",
      icon: UserRound,
      items: [{ title: "Liste des clients", url: "/dashboard/clients" }],
    },
    {
      title: "Campagnes",
      icon: Megaphone,
      items: [{ title: "Gestion des campagnes", url: "/dashboard/campagnes" }],
    },
    {
      title: "Services",
      icon: Briefcase,
      items: [{ title: "Liste des services", url: "/dashboard/services" }],
    },
    {
      title: "Lieux",
      icon: MapPin,
      items: [{ title: "Liste des lieux", url: "/dashboard/lieux" }],
    },

    {
      title: "Prestataires",
      icon: Users,
      items: [{ title: "Gestion des prestataires", url: "/prestataires" }],
    },
    {
      title: "Désinstallations",
      icon: Archive,
      items: [{ title: "Gestion des Retraits", url: "/desinstallation" }],
    },
    {
      title: "Paiements",
      icon: CreditCard,
      items: [{ title: "Gestion des Paiements", url: "/paiements" }],
    },
    


  ],

}

export function AppSidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();

  return (
    <Sidebar
      className={`
        bg-white dark:bg-gray-900 border-r 
        transition-all duration-300
        ${isOpen ? "w-64" : "w-16"}
      `}
    >
      <div className="h-full flex flex-col">

        {/* Logo */}
        <div className="p-4 flex items-center justify-center border-b">
          {isOpen ? (
            <div className="flex flex-col items-center">
              <Logo />
              <span className="text-lg font-semibold">CampTrack</span>
            </div>
          ) : (
            <Logo />
          )}
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto p-2 mb-4">
          {data.navMain.map((group, index) => {
            const isSingleItem = group.items.length === 1;
            const singleItem = group.items[0];
            const isActiveGroup = group.items.some((item) => pathname === item.url);

            if (isSingleItem && singleItem) {
              return (
                <SidebarMenuItem key={group.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === singleItem.url}
                    className={pathname === singleItem.url ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/30" : ""}
                  >
                    <Link href={singleItem.url}>
                      <group.icon className="w-5 h-5" />
                      {isOpen && <span>{singleItem.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            return (
              <Collapsible key={group.title} defaultOpen={isOpen && (index === 0 || isActiveGroup)} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <group.icon className="w-5 h-5" />
                      {isOpen && <span>{group.title}</span>}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  {group.items && isOpen && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                href={item.url}
                                className={`block text-sm px-3 py-2 rounded-md ${pathname === item.url
                                  ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                  }`}
                              >
                                {item.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </div>

      </div>
    </Sidebar>
  );
}
