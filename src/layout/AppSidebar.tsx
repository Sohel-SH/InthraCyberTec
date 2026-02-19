"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  DocsIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
// import SidebarWidget from "./SidebarWidget";
import { FiAlertOctagon, FiSettings } from 'react-icons/fi'
import { BiNews, BiData } from 'react-icons/bi'
import { GiMagnifyingGlass } from 'react-icons/gi'

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Home",
    path: '/'
  },
  {
    icon: <FiAlertOctagon className="w-6 h-6" />,
    name: "Alerts",
    path: "/alerts",
  },
  {
    icon: <GiMagnifyingGlass className="w-6 h-6" />,
    name: "Threat Hunt",
    path: "/threat-hunt",
  },

  {
    name: "LLM",
    icon: <ListIcon />,
    path: "/llm"
  },
  {
    name: "News",
    icon: <BiNews className="w-6 h-6" />,
    path: "/news"
  },
  {
    name: "Query",
    icon: <BiData className="w-6 h-6" />,
    path: "/query"
  },
  {
    name: "Configuration Settings",
    icon: <FiSettings className="w-6 h-6" />,
    path: "/configuration-settings",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const { t } = useLanguage();
  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>
                    {nav.name === "Home" ? t("nav.home") :
                     nav.name === "Alerts" ? t("nav.alerts") :
                     nav.name === "Threat Hunt" ? t("nav.threatHunt") :
                     nav.name === "LLM" ? t("nav.llm") :
                     nav.name === "News" ? t("nav.news") :
                     nav.name === "Query" ? t("nav.query") :
                     nav.name === "Configuration Settings" ? t("settings.title") : nav.name}
                  </span>
                )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group sidebar-hover-pill ${isActive(nav.path) ? "text-white rounded-xl" : "menu-item-inactive"
                  }`}
                style={
                  isActive(nav.path)
                    ? {
                        background:
                          "linear-gradient(90deg, #37C7DA 0%, #5452EB 100%)",
                        boxShadow: "0px 4px 10px 0px #00000022",
                      }
                    : undefined
                }
              >
                <span
                  className={`${isActive(nav.path) ? "text-white" : "menu-item-icon-inactive"}`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>
                  {nav.name === "Home" ? t("nav.home") :
                   nav.name === "Alerts" ? t("nav.alerts") :
                   nav.name === "Threat Hunt" ? t("nav.threatHunt") :
                   nav.name === "LLM" ? t("nav.llm") :
                   nav.name === "News" ? t("nav.news") :
                   nav.name === "Query" ? t("nav.query") :
                   nav.name === "Configuration Settings" ? t("settings.title") : nav.name}
                </span>
              )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      // onMouseEnter={() => !isExpanded && setIsHovered(true)}
      // onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`${!isExpanded && !isHovered ? "py-[24.5px]" : "py-[24.5px]"} flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-center"}`}
      >
        {/* <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <div className="dark:hidden text-center font-semibold text-[#233EFF] text-3xlsm:text-4xl md:text-5xl
  lg:text-6xl xl:text-[20px]">INTHRA</div>
              <div className="hidden dark:block text-center font-semibold text-[#233EFF] text-3xl sm:text-4xl md:text-5xl
  lg:text-6xl xl:text-[20px]">INTHRA</div>
            </>
          ) : (
            <div className="dark:hidden text-center text-[#233EFF] font-semibold text-xl sm:text-xl md:text-xl
  lg:text-xl xl:text-[20px]">INTHRA</div>
          )}
        </Link> */}
        <Link href="/">
          <div
            className={`
              text-[#233EFF] font-semibold whitespace-nowrap origin-left
              transition-all duration-300 ease-in-out
              ${isExpanded || isHovered || isMobileOpen
                ? "scale-350 opacity-100 tracking-normal"
                : "scale-120 opacity-100 tracking-tight"}
            `}
            style={{
              transformOrigin: "center",
            }}
          >
            INTHRA
          </div>
        </Link>
      </div>
      <div className="mx-4 mb-6 h-px bg-gray-200 dark:bg-white/10" />
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <button
                className="items-center justify-center w-10 h-10 text-gray-500  rounded-lg z-99999 border-0 outline-none lg:flex dark:text-gray-400 lg:h-11 lg:w-11 "
                onClick={handleToggle}
                aria-label="Toggle Sidebar"
              >
                {isMobileOpen ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="12"
                    viewBox="0 0 16 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
