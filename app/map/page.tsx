import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MapWrapper from "../mapWrapper";


export default function Home() {
    return (
        <>
            <div className="w-full relative h-full bottom-0 right-0 left-0 top-0">
                {/* <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu> */}
                <SidebarTrigger className="z-10 relative right-0 left-0 bottom-0 top-0 m-4" />
                <MapWrapper />
            </div>
        </>
    );
}
