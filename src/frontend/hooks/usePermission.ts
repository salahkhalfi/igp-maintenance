/**
 * Hooks React pour la vérification des permissions RBAC
 *
 * Ces hooks permettent au frontend de vérifier dynamiquement les permissions
 * au lieu d'utiliser des vérifications hardcodées sur les rôles.
 *
 * @example
 * const canCreateTickets = usePermission('tickets', 'create', 'all');
 * const canManageUsers = useAnyPermission(['users.update.all', 'users.delete.all']);
 */

import { useState, useEffect } from 'react';
import { apiGet } from '../../utils/api';

/**
 * Hook pour vérifier une permission spécifique
 * @param resource - Ressource (tickets, machines, users, messages, roles, comments)
 * @param action - Action (create, read, update, delete)
 * @param scope - Portée (all, own, team)
 * @returns true si l'utilisateur a la permission, false sinon
 */
export function usePermission(
  resource: string,
  action: string,
  scope: string = 'all'
): boolean {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const result = await apiGet<{ allowed: boolean }>(
          `/rbac/check?resource=${resource}&action=${action}&scope=${scope}`
        );
        setHasAccess(result.allowed || false);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [resource, action, scope]);

  return hasAccess;
}

/**
 * Hook pour vérifier plusieurs permissions (AU MOINS UNE doit être vraie)
 * @param permissions - Liste de permissions au format "resource.action.scope"
 * @returns true si l'utilisateur a au moins une des permissions
 *
 * @example
 * const canManageUsers = useAnyPermission(['users.update.all', 'users.delete.all']);
 */
export function useAnyPermission(permissions: string[]): boolean {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setLoading(true);
        const result = await apiGet<{ allowed: boolean }>(
          `/rbac/check-any?permissions=${permissions.join(',')}`
        );
        setHasAccess(result.allowed || false);
      } catch (error) {
        console.error('Permission check (any) failed:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (permissions && permissions.length > 0) {
      checkPermissions();
    } else {
      setHasAccess(false);
      setLoading(false);
    }
  }, [permissions.join(',')]);

  return hasAccess;
}

/**
 * Hook pour vérifier plusieurs permissions (TOUTES doivent être vraies)
 * @param permissions - Liste de permissions au format "resource.action.scope"
 * @returns true si l'utilisateur a toutes les permissions
 *
 * @example
 * const canFullyManageTickets = useAllPermissions([
 *   'tickets.create.all',
 *   'tickets.update.all',
 *   'tickets.delete.all'
 * ]);
 */
export function useAllPermissions(permissions: string[]): boolean {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setLoading(true);
        const result = await apiGet<{ allowed: boolean }>(
          `/rbac/check-all?permissions=${permissions.join(',')}`
        );
        setHasAccess(result.allowed || false);
      } catch (error) {
        console.error('Permission check (all) failed:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (permissions && permissions.length > 0) {
      checkPermissions();
    } else {
      setHasAccess(false);
      setLoading(false);
    }
  }, [permissions.join(',')]);

  return hasAccess;
}
