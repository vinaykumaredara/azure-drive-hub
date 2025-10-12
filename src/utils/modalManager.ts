// Modal lifecycle management to prevent sidebar/layout issues

export const modalManager = {
  openModal() {
    document.body.style.overflow = 'hidden';
    document.body.dataset.modalOpen = 'true';
    console.debug('[ModalManager] Modal opened, body scroll disabled');
  },
  
  closeModal() {
    document.body.style.overflow = '';
    delete document.body.dataset.modalOpen;
    console.debug('[ModalManager] Modal closed, body scroll restored');
  },
  
  isModalOpen(): boolean {
    return document.body.dataset.modalOpen === 'true';
  }
};
