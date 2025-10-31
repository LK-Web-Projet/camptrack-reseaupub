import * as React from "react"
import { GalleryVerticalEnd, Minus, Plus } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,

  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Logo } from "./ui/logo"

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Tableau de bord",
      items: [
           { title: "Tableau de bord", url: "/dashboard" },
      ],
    },
    {
      title: "Campagnes",
      items: [
        { title: "Gestion des campagnes", url: "/campagnes" },
    
      ],
    },
    {
      title: "Tricycles",
      items: [
        { title: "Liste des tricycles", url: "/tricycles" },
      ],
    },
   
     {
      title: "Prestataires",
      items: [
        { title: "Gestion des prestataires", url: "/prestataires" },
      ],
    },
     {
      title: "Incidents",
      items: [
        { title: "Liste des clients", url: "/clients" },
      ],
    },
     {
      title: "Suivi",
      items: [
        { title: "Suivi des performences", url: "/performences" },
      ],
    },
     {
      title: "Déconnexion",
      items: [
        { title: "Se Déconnecter", url: "/logout" },
      ],
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
     
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                {/* <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div> */}
               
                  <Logo
                  />
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">CampTrack</span>
                 
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm />
     
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={index === 1}
                className="group/collapsible space-y-4 mb-4"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="font-semibold text-md">
                      {item.title}{""}
                      <Plus className="ml-auto text-[#d61353] group-data-[state=open]/collapsible:hidden" />
<Minus className="ml-auto text-[#d61353] group-data-[state=closed]/collapsible:hidden" />

                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={item.isActive}
                            >
                              <a href={item.url}>{item.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
        <SidebarFooter>
  <div className="px-4 py-3 text-sm text-sidebar-foreground space-y-2">
    {/* Avatar + Username */}
    <div className="flex items-center justify-center gap-3">
      <img
        src="/avatar.jpg" // Remplace par ton image ou un avatar par défaut
        alt="Avatar"
        className="w-8 h-8 rounded-full object-cover border border-[--sidebar-border]"
      />
      <span className="font-medium">Ichmella</span>
    </div>

    
  </div>
</SidebarFooter>
      <SidebarRail />
   

    </Sidebar>
  )
}
