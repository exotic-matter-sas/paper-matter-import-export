/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export default {
  en: {
    rootFolderName: 'Root',
    bFormFile: {
      BrowseLabel: 'Browse'
    },
    bModal: {
      okButtonValue: 'OK',
      continueButtonValue: 'Continue',
      cancelButtonValue: 'Cancel'
    },
    loginPage: {
      emailInputLabel: 'Email',
      passwordInputLabel: 'Password',
      forgotPasswordLink: 'Forgot password?',
      submitInputValue: 'Login',
      loadingSpinnerLabel: 'Loading...',
      loginDomainLabel: 'Login to: '
    },
    homePage: {
      importTabLabel: 'Import',
      exportTabLabel: 'Export',
      loggedAsLabel: 'Logged as: ',
      disconnectTooltip: 'Disconnect'
    },
    importTab: {
      sourcesFormGroupLabel: 'Sources',
      filesInputPlaceholder: 'Choose pdf documents to import...',
      filesInputDropLabel: 'Drop pdf documents to import here...',
      folderInputPlaceholder: 'Choose a folder to import...',
      folderInputDropLabel: 'Drop a folder to import here...',
      destinationFormGroupLabel: 'Destination',
      destinationFormGroupDescription: 'Selected files and/or content of selected folder will be imported into the destination',
      importButtonValueWithoutMetadata: 'Import documents',
      importButtonValueWithMetadata: 'Import documents with metadata',
    },
    exportTab: {
      comingSoonLabel: 'Coming soon',
      exportButtonValue: 'Export'
    },
    folderPickerModal: {
      importTitle: 'Select destination folder',
      exportTitle: 'Select folder to export',
      selectedFolderLabel: 'selected folder: ',
      noFolderSelectedLabel: 'No folder selected',
    },
    ftlTreeFolders: {
      noFolderCreatedLabel: 'No folder created yet',
      cantLoadFolderLabel: 'Folders can\'t be loaded'
    },
    progressModal: {
      importTitle: 'Importing your documents...',
      exportTitle: 'Exporting your documents...',
      errorCountLabel: ' | one error | {n} errors',
      stopButtonValue: 'Stop'
    },
    documentsMetadataModal: {
      title: 'Documents metadata',
      sourceFormGroupLabel: 'Source',
      csvInputPlaceholder: 'Choose csv file to use',
      csvInputDropLabel: 'Drop csv file to use here...',
      previewFormGroupLabel: 'First 100 lines preview',
      startImportButton: 'Start import',
      startImportLoadingButton: 'Checking metadata...',
      filePathLabel: 'File Path*',
      filePathTooltip: 'Full path of pdf files to import (required)',
      documentTitleLabel: 'Doc. Title',
      documentTitleTooltip: 'Document title will be used in document list and preview, it make document search easier',
      documentNotesLabel: 'Doc. Notes',
      documentNotesTooltip: 'Document notes will be displayed in document preview, it make document search easier',
      errorReadingCsvTitle: 'Error during csv reading',
      errorReadingCsvMessage: 'Can\'t read CSV file',
      errorReadingCsvDetail: 'Check you have permission to read this file and that it still exist.',
      errorParsingCsvTitle: 'Error during csv parsing',
      errorParsingCsvMessage: 'Can\'t read CSV data',
      errorParsingCsvDetail: 'CSV file seems corrupt or not properly formatted. Try to open csv file in a text editor to check file format, first csv line must also define unique column names',
      warningMetadataNoMatchTitle: 'Fix metadata selection',
      warningMetadataNoMatchMessage: 'No metadata match documents to import',
      warningMetadataNoMatchDetail: 'Check that File path is properly selected and formatted.',
      warningDocumentsMissingMetadataTitle: 'Confirm metadata selection',
      warningDocumentsMissingMetadataMessage: 'Some documents have no metadata associated',
      warningDocumentsMissingMetadataDetail: '| Metadata are missing for one document, do you want to proceed anyway? | Metadata are missing for {n} documents, do you want to proceed anyway?',
    }
  },
  fr: {
    rootFolderName: 'Racine',
    bFormFile: {
      BrowseLabel: 'Parcourir'
    },
    bModal: {
      okButtonValue: 'Valider',
      continueButtonValue: 'Continuer',
      cancelButtonValue: 'Annuler'
    },
    loginPage: {
      emailInputLabel: 'Email',
      passwordInputLabel: 'Mot de passe',
      forgotPasswordLink: 'Mot de passe oublié ?',
      submitInputValue: 'Se connecter',
      loadingSpinnerLabel: 'Chargement...',
      loginDomainLabel: 'Connexion à : '
    },
    homePage: {
      importTabLabel: 'Import',
      exportTabLabel: 'Export',
      loggedAsLabel: 'Connecté : ',
      disconnectTooltip: 'Se déconnecter'
    },
    importTab: {
      sourcesFormGroupLabel: 'Sources',
      filesInputPlaceholder: 'Choisissez les documents pdf à importer...',
      filesInputDropLabel: 'Déposez les documents pdf à importer ici...',
      folderInputPlaceholder: 'Choisissez un dossier à importer...',
      folderInputDropLabel: 'Déposer un dossier à importer ici...',
      destinationFormGroupLabel: 'Destination',
      destinationFormGroupDescription: 'Les fichiers sélectionnés et/ou le contenu du dossier sélectionné seront importés dans la destination',
      importButtonValueWithoutMetadata: 'Importer les documents',
      importButtonValueWithMetadata: 'Importer les documents avec des métadonnées',
    },
    exportTab: {
      comingSoonLabel: 'Bientôt disponible',
      exportButtonValue: 'Exporter'
    },
    folderPickerModal: {
      importTitle: 'Sélectionnez le dossier de destination',
      exportTitle: 'Sélectionnez le dossier à exporter',
      selectedFolderLabel: 'sélection : ',
      noFolderSelectedLabel: 'Pas de dossier sélectionné',
    },
    ftlTreeFolders: {
      noFolderCreatedLabel: 'Vous n\'avez pas encore créé de dossier',
      cantLoadFolderLabel: 'Les dossiers n\'ont pu être chargés'
    },
    progressModal: {
      importTitle: 'Import de vos documents...',
      exportTitle: 'Export de vos documents...',
      errorCountLabel: ' | une erreur | {n} erreurs',
      stopButtonValue: 'Stop'
    },
    documentsMetadataModal: {
      title: 'Métadonnées des documents',
      sourceFormGroupLabel: 'Source',
      csvInputPlaceholder: 'Choisissez un fichier csv à utiliser...',
      csvInputDropLabel: 'Déposez un fichier csv à utiliser ici...',
      previewFormGroupLabel: 'Prévisualisation des 100 premières lignes',
      startImportButton: 'Démarrer l\'import',
      startImportLoadingButton: 'Vérification des métadonnées...',
      filePathLabel: 'Chemin du fichier*',
      filePathTooltip: 'Chemin complet du fichier pdf à importer (requis)',
      documentTitleLabel: 'Titre du doc.',
      documentTitleTooltip: 'Le titre du document sera visible dans la liste et dans l\'apercu, il rend la recherche du document plus facile',
      documentNotesLabel: 'Notes du doc.',
      documentNotesTooltip: 'Les notes du documents seront visibles dans l\'apercu du document, elles rendent la recherche du document plus facile',
      errorReadingCsvTitle: 'Erreur durant la lecture du CSV',
      errorReadingCsvMessage: 'Le fichier CSV ne peut être lu',
      errorReadingCsvDetail: 'Vérifiez que vous avez les permissions de lecture du fichier et qu\'il est toujours présent.',
      errorParsingCsvTitle: 'Erreur durant l\'analyse du CSV',
      errorParsingCsvMessage: 'Les données du CSV ne peuvent être lues',
      errorParsingCsvDetail: 'Le fichier CSV semble être corrompu ou formaté de manière incorrecte. Essayer d\'ouvrir le fichier CSV dans un éditeur de texte pour vérifier son format, la première ligne du CSV doit également définir des noms de colonne uniques.',
      warningMetadataNoMatchTitle: 'Corrigez les métadonnées sélectionnées',
      warningMetadataNoMatchMessage: 'Aucune métadonnée ne correspond aux documents à importer',
      warningMetadataNoMatchDetail: 'Vérifiez que le Chemin du fichier est correctement sélectionné et formatté.',
      warningDocumentsMissingMetadataTitle: 'Confirmez la sélection des métadonnées',
      warningDocumentsMissingMetadataMessage: 'Certains documents n\'ont pas de metadonnées associées',
      warningDocumentsMissingMetadataDetail: '| Les métadonnées sont manquantes pour un document, voulez-vous poursuivre ? | Les métadonnées sont manquantes pour {n} documents, voulez-vous poursuivre ?',
    }
  }
}
