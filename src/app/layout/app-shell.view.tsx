import { Link, Outlet } from 'react-router';
import {
  ChartBarIcon,
  BarcodeIcon,
  BuildingsIcon,
  UsersIcon,
  GearSixIcon,
  ListIcon,
  ArrowSquareOutIcon,
} from '@phosphor-icons/react';
import type { useAppShellModel } from './app-shell.model';
import styles from './styles/app-shell.module.css';
const icons = {
  chart: ChartBarIcon,
  bill: BarcodeIcon,
  company: BuildingsIcon,
  users: UsersIcon,
  settings: GearSixIcon,
};
export function AppShellView(props: ReturnType<typeof useAppShellModel>) {
  const {
    profile,
    profiles,
    nav,
    menuOpen,
    toggleMenu,
    closeMenu,
    changeActor,
    currentLabel,
  } = props;
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Pular para o conteúdo
      </a>
      <aside className={styles.sidebar} data-open={menuOpen}>
        <Link to="/" className={styles.brand} onClick={closeMenu}>
          <span className={styles.brandMark}>
            <BuildingsIcon size={26} weight="duotone" />
          </span>
          <span>
            SITICOP<span className={styles.brandSuffix}>MG</span>
            <small>Gestão de contribuições</small>
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          {nav.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={item.active ? 'page' : undefined}
                onClick={closeMenu}
              >
                <Icon size={20} weight={item.active ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFooter}>
          <p>Contribuição negocial</p>
          <span>Construção pesada · Minas Gerais</span>
          <a href="https://siticopmg.org.br/" target="_blank" rel="noreferrer">
            Site institucional <ArrowSquareOutIcon size={14} />
          </a>
        </div>
      </aside>
      {menuOpen && (
        <button
          className={styles.backdrop}
          onClick={closeMenu}
          aria-label="Fechar menu"
        />
      )}
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            onClick={toggleMenu}
            aria-label="Alternar navegação"
            aria-expanded={menuOpen}
          >
            <ListIcon size={23} />
          </button>
          <span className={styles.breadcrumb}>
            SITICOP-MG <span>/</span> {currentLabel}
          </span>
          <div className={styles.profile}>
            <span className={styles.demoBadge}>Demonstração</span>
            <label>
              <span className="sr-only">Perfil de acesso simulado</span>
              <select
                value={profile.id}
                onChange={(event) => changeActor(event.target.value)}
                title={profile.role === 'operator' ? 'Operadores visualizam somente os boletos que criaram.' : 'Administradores e diretores visualizam todas as cobranças.'}
              >
                {profiles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <main id="main" className={styles.main} key={profile.id}>
          <Outlet />
        </main>
        <footer className={styles.footer}>
          Ambiente demonstrativo · dados fictícios salvos neste navegador
          <span>Data de referência: 08/09/2026</span>
        </footer>
      </div>
    </div>
  );
}
