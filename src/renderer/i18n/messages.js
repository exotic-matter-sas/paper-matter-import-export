/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export default {
  en: {
    rootFolderName: "Root",
    yourComputer: "Your computer",
    yourPaperMatterOrg: "Your Paper Matter organization",
    reportAnIssue: "Report an issue",
    loadingSpinnerLabel: "Loading...",
    bFormFile: {
      BrowseLabel: "Browse",
    },
    bModal: {
      okButtonValue: "OK",
      continueButtonValue: "Continue",
      closeButtonValue: "Close",
      cancelButtonValue: "Cancel",
    },
    main: {
      warningExitingActionIncompleteTitle: "Are you sure you want to quit?",
      warningExitingActionIncompleteMessage:
        "There are some documents which remain to be imported or exported.",
      warningExitingActionIncompleteDetail:
        "If you close now, ongoing import or export wont be fully completed.",
    },
    splashScreenPage: {
      downloadingUpdate: "Downloading update",
    },
    loginPage: {
      logoAlt: "Paper Matter logo",
      submitInputValue: "Login",
      loginDomainLinkTitle:
        "If you are using a self-hosted Paper Matter, click to set your server address",
      loginLinkTitle: "Will open your browser to log you in",
      errorAuthorizationFailed:
        "Access to your account has been refused, you can retry to login (error code: {0}).",
    },
    EditServerModal: {
      title: "Paper Matter instance settings",
      serverInputLabel: "Server address",
      clientIdInputLabel: "Client ID",
      serverInputDescription:
        "Copy url displayed in your browser when you are logged into your Paper Matter account (or leave blank to reset default value).",
      clientIdInputDescription:
        "Ask this ID to your self hosted instance admin, he have to create app as {self_hosting_doc_link} (or leave blank to reset default value).",
      clientIdInputDescriptionLinkText: "mentioned here",
      errorParseServerAddress:
        "Url is not properly formatted (it should be something like https://example.com)",
    },
    homePage: {
      importTabLabel: "Import",
      exportTabLabel: "Export",
      loggedAsLabel: "Logged as: ",
      disconnectTooltip: "Disconnect",
    },
    importTab: {
      sourcesFormGroupDescriptionCheck: "Checking files inside folder...",
      sourcesFormGroupDescriptionWarning1: " | One file | {n} files",
      sourcesFormGroupDescriptionWarning1Title:
        " | Click to display file details | Click to display files details",
      sourcesFormGroupDescriptionWarning2:
        " | won't be imported in selected folder, its type isn't supported.| won't be imported in selected folder, their types aren't supported.",
      displayUnsupportedFilesInsideFolderReportIntro:
        "Files below won't be imported, Paper Matter only support the following files types: {files_extensions}",
      sourcesFormGroupLabel: "Sources",
      filesInputPlaceholder: "Choose documents to import...",
      filesInputDropLabel: "Drop documents to import here...",
      folderInputPlaceholder: "Choose a folder to import...",
      folderInputDropLabel: "Drop a folder to import here...",
      destinationFormGroupLabel: "Destination",
      destinationFormGroupDescription:
        "Selected files (or content of selected folder) will be imported into the destination",
      importButtonWithoutMetadataValue: "Import documents",
      importButtonWithMetadataValue: "Import documents with metadata",
      warningResumeLastImportTitle: "You can resume last import",
      warningResumeLastImportMessage: "Last import wasn't fully completed.",
      warningResumeLastImportDetail:
        "| There is one file left to import, you can finish the import by clicking the Import button. | There is {n} files left to import, you can finish the import by clicking the Import button.",
      successImportTitle: "Documents successfully imported",
      successImportMessage:
        "| One document imported without error. | {n} documents imported without error.",
      warningImportInterruptedTitle: "Import interrupted",
      warningImportInterruptedMessage:
        "You have been disconnected, please log again to resume your import",
      errorImportTitle:
        "| One error occurred during import | Errors occurred during import",
      errorImportMessage:
        "| One document couldn't be imported: | {n} documents couldn't be imported:",
      errorImportDetail:
        "| You can retry to import it by clicking the Import button. | You can retry to import them by clicking the Import button.",
      displayErrorReportButtonValue: "Display detailed report",
    },
    exportTab: {
      sourcesFormGroupLabel: "Source",
      destinationFormGroupLabel: "Destination",
      folderInputPlaceholder: "Choose a destination folder...",
      setDestinationFolderPromptTitle: "Select destination folder for export",
      setDestinationFolderPromptMessage:
        "A new folder will be created inside selected destination",
      destinationFormGroupDescription:
        "Source folder will be exported into the destination (empty folders wont be exported)",
      exportButtonValue: "Export documents",
      warningResumeLastExportTitle: "You can resume last export",
      warningResumeLastExportMessage: "Last export wasn't fully completed.",
      warningResumeLastExportDetail:
        "| There is one file left to export, you can finish the export by clicking the Export button. | There is {n} files left to export, you can finish the export by clicking the Export button.",
      errorExportTitle:
        "| One error occurred during export | Errors occurred during export",
      errorExportMessage:
        "| One document couldn't be exported: | {n} documents couldn't be exported:",
      errorExportDetail:
        "| You can retry to export it by clicking the Export button{joined_mentions}. | You can retry to export them by clicking the Export button{joined_mentions}.",
      successExportTitle: "Documents successfully exported",
      successExportMessage:
        "No document exported | One document exported without error{joined_mentions}. | {n} documents exported without error{joined_mentions}.",
      warningExportInterruptedTitle: "Export interrupted",
      warningExportInterruptedMessage:
        "You have been disconnected, please log again to resume your export",
      displayErrorReportButtonValue: "Display detailed report",
      metadataNotExportedMention: "documents metadata couldn't be exported",
      and: " and ",
      displayFolderButtonValue: "Display folder",
      sourceOnlyRootTitle: "Only root folder could be exported for now",
      expectedFatalErrors: {
        exportFolderCreationFailed: {
          title: "Error when creating export folder",
          message:
            "Can't create export folder, please check that you can save file into the selected destination",
          detail: "Or try to select another destination",
        },
        documentsListingFailed: {
          title: "Error when listing your documents",
          message:
            "Can't list your documents, please check you can properly list them on your Paper Matter app",
          detail: "Or retry your export later",
        },
      },
      unexpectedFatalErrors: {
        title: "Unexpected error when exporting",
        message: "Unexpected error, please retry to export",
        detail:
          "If the error persist, please report the issue by clicking the button bellow",
      },
    },
    folderPickerModal: {
      importTitle: "Select destination folder",
      exportTitle: "Select folder to export",
      selectedFolderLabel: "selected folder: ",
      noFolderSelectedLabel: "No folder selected",
    },
    ftlTreeFolders: {
      noFolderCreatedLabel: "No folder created yet",
      cantLoadFolderLabel: "Folders can't be loaded",
    },
    progressModal: {
      importTitle: "Importing your documents...",
      exportTitle1: "Listing documents...",
      exportSubTitle1: "Step 1/2",
      exportTitle2: "Downloading documents...",
      exportSubTitle2: "Step 2/2",
      errorCountLabel: " | One error | {n} errors",
      interruptButtonValue: "Interrupt",
    },
    documentsMetadataModal: {
      title: "Documents metadata",
      sourceFormGroupLabel: "Source",
      csvInputPlaceholder: "Choose CSV file to use",
      csvInputDropLabel: "Drop CSV file to use here...",
      previewFormGroupLabel: "First 100 lines preview",
      startImportButton: "Start import",
      startImportLoadingButton: "Checking metadata...",
      filePathLabel: "File Path*",
      filePathTooltip: "Full filepaths to import (required)",
      documentTitleLabel: "Doc. Title",
      documentTitleTooltip:
        "Document title will be used in document list and preview, it makes document search easier",
      documentNotesLabel: "Doc. Notes",
      documentNotesTooltip:
        "Document notes will be displayed in document preview, it makes document search easier",
      errorReadingCsvTitle: "Error during CSV reading",
      errorReadingCsvMessage: "Can't read CSV file",
      errorReadingCsvDetail:
        "Check you have permission to read this file and that it still exists.",
      errorParsingCsvTitle: "Error during csv parsing",
      errorParsingCsvMessage: "Can't read CSV data",
      errorParsingCsvDetail:
        "CSV file seems corrupt or not properly formatted. Try to open CSV file in a text editor to check file format, first CSV line must also define unique column names",
      warningMetadataNoMatchTitle: "Fix metadata selection",
      warningMetadataNoMatchMessage: "No metadata match documents to import",
      warningMetadataNoMatchDetail:
        "Check that File path is properly selected and formatted.",
      warningDocumentsMissingMetadataTitle: "Confirm metadata selection",
      warningDocumentsMissingMetadataMessage:
        "Some documents have no metadata associated",
      warningDocumentsMissingMetadataDetail:
        "| Metadata are missing for one document, do you want to proceed anyway? | Metadata are missing for {n} documents, do you want to proceed anyway?",
    },
    retryModal: {
      import: "import",
      importInfinitive: "import",
      imported: "imported",
      export: "export",
      exportInfinitive: "export",
      exported: "exported",
      retryTitle:
        " | One document left to {action_infinitive} | {n} documents left to {action_infinitive}",
      resumeSubTitle:
        "Last {action} wasn't completed, would you like to resume it?",
      retrySubTitle:
        " | An error prevent a document to be {action_ed}, would you like to retry to {action} it? | Errors prevent some documents to be {action_ed}, would you like to retry to {action} them?",
      abortButtonValue: "Abort",
      retryButtonValue: "Retry {action}",
      resumeButtonValue: "Resume {action}",
    },
  },
  fr: {
    rootFolderName: "Racine",
    yourComputer: "Votre ordinateur",
    yourPaperMatterOrg: "Votre organisation Paper Matter",
    reportAnIssue: "Signaler un bug",
    loadingSpinnerLabel: "Chargement...",
    bFormFile: {
      BrowseLabel: "Parcourir",
    },
    bModal: {
      okButtonValue: "Valider",
      continueButtonValue: "Continuer",
      closeButtonValue: "Quitter",
      cancelButtonValue: "Annuler",
    },
    main: {
      warningExitingActionIncompleteTitle: "Êtes-vous sûr de vouloir quitter ?",
      warningExitingActionIncompleteMessage:
        "Certains documents restent à importer ou exporter.",
      warningExitingActionIncompleteDetail:
        "Si vous quittez maintenant, l'import ou l'export en cours ne sera pas complètement terminé.",
    },
    splashScreenPage: {
      downloadingUpdate: "Téléchargement de la mise à jour",
    },
    loginPage: {
      logoAlt: "Logo Paper Matter",
      submitInputValue: "Se connecter",
      loginDomainLinkTitle:
        "Si vous utilisez une version auto-hébergée de Paper Matter, cliquez pour saisir l'adresse de votre serveur",
      loginLinkTitle: "Votre navigateur sera ouvert pour vous connecter",
      errorAuthorizationFailed:
        "L'accès à votre compte a été refusé, vous pouvez essayer de vous reconnecter (code erreur : {0}).",
    },
    EditServerModal: {
      title: "Configuration de l'instance Paper Matter",
      serverInputLabel: "Adresse du serveur",
      clientIdInputLabel: "Client ID",
      serverInputDescription:
        "Copiez l'adresse affichée dans votre navigateur quand vous êtes connecté à votre compte Paper Matter (ou laissez vide pour restaurer la valeur par défaut).",
      clientIdInputDescription:
        "Demandez cet ID à l'Administarteur de votre instance, celui-ci doit créer l'application comme {self_hosting_doc_link} (ou laissez vide pour restaurer la valeur par défaut).",
      clientIdInputDescriptionLinkText: "mentionné ici",
      errorParseServerAddress:
        "L'adresse n'est pas correctement formatée (elle devrait ressembler à https://exemple.com)",
    },
    homePage: {
      importTabLabel: "Import",
      exportTabLabel: "Export",
      loggedAsLabel: "Connecté : ",
      disconnectTooltip: "Se déconnecter",
    },
    importTab: {
      sourcesFormGroupDescriptionCheck:
        "Vérification des fichiers dans le dossier...",
      sourcesFormGroupDescriptionWarning1: " | Un fichier | {n} fichiers",
      sourcesFormGroupDescriptionWarning1Title:
        "| Cliquez pour afficher un rapport du fichier concerné | Cliquez pour afficher un rapport des fichiers concernés",
      sourcesFormGroupDescriptionWarning2:
        " | ne sera pas importé dans le dossier sélectionné, son type n'est pas supporté.| ne seront pas importés dans le dossier sélectionné, leurs types ne sont pas supportés.",
      displayUnsupportedFilesInsideFolderReportIntro:
        "Les fichiers ci-dessous ne seront pas importés, Paper Matter supporte uniquement les types de fichiers suivants : {files_extensions}",
      sourcesFormGroupLabel: "Sources",
      filesInputPlaceholder: "Choisissez les documents à importer...",
      filesInputDropLabel: "Déposez les documents à importer ici...",
      folderInputPlaceholder: "Choisissez un dossier à importer...",
      folderInputDropLabel: "Déposez un dossier à importer ici...",
      destinationFormGroupLabel: "Destination",
      destinationFormGroupDescription:
        "Les fichiers sélectionnés et/ou le contenu du dossier sélectionné seront importés dans la destination",
      importButtonWithoutMetadataValue: "Importer les documents",
      importButtonWithMetadataValue:
        "Importer les documents avec des métadonnées",
      warningResumeLastImportTitle: "Vous pouvez reprendre le dernier import",
      warningResumeLastImportMessage: "Le dernier import n'a pas été terminé.",
      warningResumeLastImportDetail:
        "| Il y a un fichier restant à importer, vous pouvez terminer l'import en cliquant sur le bouton Importer. | Il y a {n} fichiers restant à importer, vous pouvez terminer l'import en cliquant sur le bouton Importer.",
      successImportTitle: "Documents importés avec succès",
      successImportMessage:
        "|  Un document importé sans erreur. | {n} documents importés sans erreurs.",
      warningImportInterruptedTitle: "Import interrompu",
      warningImportInterruptedMessage:
        "Vous avez été déconnecté, veuillez vous reconnecter pour poursuivre l'import",
      errorImportTitle:
        "| Une erreur s'est produite durant l'import | Des erreurs se sont produites durant l'import",
      errorImportMessage:
        "| Un document n'a pu être importé : | {n} documents n'ont pu être importés :",
      errorImportDetail:
        "| Vous pouvez retenter de l'importer en cliquant sur le bouton Importer. | Vous pouvez retenter de les importer en cliquant sur le bouton Importer.",
      displayErrorReportButtonValue: "Afficher le rapoort détaillé",
    },
    exportTab: {
      sourcesFormGroupLabel: "Source",
      destinationFormGroupLabel: "Destination",
      folderInputPlaceholder: "Choisissez un dossier à importer...",
      setDestinationFolderPromptTitle:
        "Sélectionnez le dossier de destination de l'export",
      setDestinationFolderPromptMessage:
        "Un nouveau dossier sera créé dans cette destination",
      destinationFormGroupDescription:
        "Le dossier source sera exporté vers la destination (les dossiers vides ne seront pas exportés)",
      exportButtonValue: "Exporter les documents",
      warningResumeLastExportTitle: "Vous pouvez reprendre le dernier export",
      warningResumeLastExportMessage: "Le dernier export n'a pas été terminé.",
      warningResumeLastExportDetail:
        "| Il reste un document à exporter, vous pouvez terminer l'export en cliquant sur le bouton Exporter. | Il y a {n} documents à exporter, vous pouvez terminer l'export en cliquant sur le bouton Exporter.",
      errorExportTitle:
        "| Une erreur est survenue durant l'export | Des erreurs sont survenues durant l'export",
      errorExportMessage:
        "| Un document n'a pu être exporté : | {n} documents n'ont pu être exportés :",
      errorExportDetail:
        "| Vous pouvez retenter de l'exporter en cliquant sur le bouton Exporter{joined_mentions}. | Vous pouvez retenter de les exporter en cliquant sur le bouton Exporter{joined_mentions}.",
      successExportTitle: "Documents exportés avec succès",
      successExportMessage:
        "Aucun document exporté | Un document exporté sans erreur{joined_mentions}. | {n} documents exportés sans erreur{joined_mentions}.",
      warningExportInterruptedTitle: "Export interrompu",
      warningExportInterruptedMessage:
        "vous avez été déconnecté, veuillez vous reconnecter pour reprendre l'export",
      displayErrorReportButtonValue: "Afficher le rapport détaillé",
      metadataNotExportedMention:
        "les métadonnées des documents n'ont pu être exportées",
      and: " et ",
      displayFolderButtonValue: "Afficher le dossier",
      sourceOnlyRootTitle:
        "Seul le dossier racine peut être exporté actuellement",
      expectedFatalErrors: {
        exportFolderCreationFailed: {
          title: "Erreur lors de la création du dossier d'export",
          message:
            "Le dossier d'export n'a pu être créé, veuillez vérifier que vous pouvez enregistrer des fichiers dans la destination sélectionnée",
          detail: "Ou essayer de sélectionner une autre destination",
        },
        documentsListingFailed: {
          title: "Erreur lors du listage de vos documents",
          message:
            "Vos documents n'ont pu être listés, veuillez vérifier que vous pouvez correctement les lister sur votre app Paper Matter",
          detail: "Ou retentez l'export plus tard",
        },
      },
      unexpectedFatalErrors: {
        title: "Erreur imprévue lors de l'export",
        message: "Erreur imprévue, veuillez retenter l'export",
        detail:
          "Si l'erreur persiste, veuilliez signaler ce bug en cliquant sur le bouton ci-dessous",
      },
    },
    folderPickerModal: {
      importTitle: "Sélectionnez le dossier de destination",
      exportTitle: "Sélectionnez le dossier à exporter",
      selectedFolderLabel: "sélection : ",
      noFolderSelectedLabel: "Pas de dossier sélectionné",
    },
    ftlTreeFolders: {
      noFolderCreatedLabel: "Vous n'avez pas encore créé de dossier",
      cantLoadFolderLabel: "Les dossiers n'ont pu être chargés",
    },
    progressModal: {
      importTitle: "Import de vos documents...",
      exportTitle1: "Listage des documents...",
      exportSubTitle1: "Étape 1/2",
      exportTitle2: "Téléchargement des documents...",
      exportSubTitle2: "Étape 2/2",
      errorCountLabel: " | Une erreur | {n} erreurs",
      interruptButtonValue: "Interompre",
    },
    documentsMetadataModal: {
      title: "Métadonnées des documents",
      sourceFormGroupLabel: "Source",
      csvInputPlaceholder: "Choisissez un fichier CSV à utiliser...",
      csvInputDropLabel: "Déposez un fichier CSV à utiliser ici...",
      previewFormGroupLabel: "Prévisualisation des 100 premières lignes",
      startImportButton: "Démarrer l'import",
      startImportLoadingButton: "Vérification des métadonnées...",
      filePathLabel: "Chemin du fichier*",
      filePathTooltip: "Chemin complet du fichier à importer (requis)",
      documentTitleLabel: "Titre du doc.",
      documentTitleTooltip:
        "Le titre du document sera visible dans la liste et dans l'aperçu, il rend la recherche du document plus facile",
      documentNotesLabel: "Notes du doc.",
      documentNotesTooltip:
        "Les notes du document seront visibles dans l'aperçu du document, elles rendent la recherche du document plus facile",
      errorReadingCsvTitle: "Erreur durant la lecture du CSV",
      errorReadingCsvMessage: "Le fichier CSV ne peut être lu",
      errorReadingCsvDetail:
        "Vérifiez que vous avez les permissions de lecture du fichier et qu'il est toujours présent.",
      errorParsingCsvTitle: "Erreur durant l'analyse du CSV",
      errorParsingCsvMessage: "Les données du CSV ne peuvent être lues",
      errorParsingCsvDetail:
        "Le fichier CSV semble être corrompu ou formaté de manière incorrecte. Essayer d'ouvrir le fichier CSV dans un éditeur de texte pour vérifier son format, la première ligne du CSV doit également définir des noms de colonne uniques.",
      warningMetadataNoMatchTitle: "Corrigez les métadonnées sélectionnées",
      warningMetadataNoMatchMessage:
        "Aucune métadonnée ne correspond aux documents à importer",
      warningMetadataNoMatchDetail:
        "Vérifiez que le Chemin du fichier est correctement sélectionné et formaté.",
      warningDocumentsMissingMetadataTitle:
        "Confirmez la sélection des métadonnées",
      warningDocumentsMissingMetadataMessage:
        "Certains documents n'ont pas de métadonnées associées",
      warningDocumentsMissingMetadataDetail:
        "| Les métadonnées sont manquantes pour un document, voulez-vous poursuivre ? | Les métadonnées sont manquantes pour {n} documents, voulez-vous poursuivre ?",
    },
    retryModal: {
      import: "import",
      importInfinitive: "importer",
      imported: "importé",
      export: "export",
      exportInfinitive: "exporter",
      exported: "exporté",
      retryTitle:
        " | Un document restant à {action_infinitive} | {n} documents restants à {action_infinitive}",
      resumeSubTitle:
        "Le dernier {action} n'a pas été terminé, voulez-vous le reprendre ?",
      retrySubTitle:
        " | Une erreur a empêché un document d'être {action_ed}, voulez-vous réessayer de l'{action_infinitive} ? | Des erreurs ont empêché des documents d'être {action_ed}, voulez-vous réssayer de les {action_infinitive} ?",
      abortButtonValue: "Abandonner",
      retryButtonValue: "Retenter l'{action}",
      resumeButtonValue: "Reprendre l'{action}",
    },
  },
};
