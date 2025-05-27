class NavigationHistory {
  private history: string[] = [];
  private tabHistory: Record<string, string[]> = {}; // Historique par onglet
  private maxHistorySize = 10;
  private currentTab: string = '/(tabs)/';

  push(route: string, isTabNavigation: boolean = false) {
    console.log('NavigationHistory - Push:', route, 'isTab:', isTabNavigation);
    
    if (isTabNavigation) {
      // Si c'est une navigation d'onglet, on reset l'historique
      this.currentTab = route;
      this.history = [route];
      if (!this.tabHistory[route]) {
        this.tabHistory[route] = [];
      }
    } else {
      // Navigation normale (push)
      if (this.history[this.history.length - 1] !== route) {
        this.history.push(route);
        
        // Ajouter à l'historique de l'onglet actuel
        if (!this.tabHistory[this.currentTab]) {
          this.tabHistory[this.currentTab] = [];
        }
        this.tabHistory[this.currentTab].push(route);
        
        if (this.history.length > this.maxHistorySize) {
          this.history.shift();
        }
        if (this.tabHistory[this.currentTab].length > this.maxHistorySize) {
          this.tabHistory[this.currentTab].shift();
        }
      }
    }
    
    console.log('NavigationHistory - Current history:', this.history);
  }

  pop(): string | null {
    console.log('NavigationHistory - Pop called, current history:', this.history);
    
    if (this.history.length > 1) {
      // Retirer la page actuelle
      this.history.pop();
      const previousRoute = this.history[this.history.length - 1];
      
      // Aussi retirer de l'historique de l'onglet
      if (this.tabHistory[this.currentTab] && this.tabHistory[this.currentTab].length > 0) {
        this.tabHistory[this.currentTab].pop();
      }
      
      console.log('NavigationHistory - Returning to:', previousRoute);
      return previousRoute;
    }
    
    // Si on est au début de l'historique, retourner à l'onglet principal
    console.log('NavigationHistory - No history, returning to tab:', this.currentTab);
    return this.currentTab;
  }

  setCurrentTab(tab: string) {
    this.currentTab = tab;
    console.log('NavigationHistory - Set current tab:', tab);
  }

  getCurrent(): string | null {
    return this.history[this.history.length - 1] || null;
  }

  getPrevious(): string | null {
    return this.history[this.history.length - 2] || null;
  }

  clear() {
    this.history = [];
    this.tabHistory = {};
  }

  getHistory(): string[] {
    return [...this.history];
  }

  getTabHistory(): Record<string, string[]> {
    return { ...this.tabHistory };
  }
}

export const navigationHistory = new NavigationHistory();
