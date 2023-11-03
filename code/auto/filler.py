from selenium import webdriver

def test_programme():
    # Ouvrir Chrome
    driver = webdriver.Chrome()

    # Aller à l'URL de votre programme
    driver.get("http://localhost:3000/addBook")

    # Fonction pour simplifier l'utilisation de querySelector
    def set_value(selector, value):
        escaped_value = value.replace('"', '\\"')
        script = 'document.querySelector(arguments[0]).value = arguments[1]'
        driver.execute_script(script, selector, escaped_value)

    # Remplir les champs avec querySelector
    set_value('input[name="title"]', "Test Titre")
    set_value('input[name="author"]', "Test Auteur 1, Test Auteur 2  ,   Test Auteur 3 ")
    set_value('textarea[name="summary"]', "Test Résumé")
    set_value('input[name="genre"]', "Test Genre 1, Test Genre 2")
    set_value('input[name="editor"]', "Test Éditeur")
    set_value('input[name="publicationYear"]', "2020")
    set_value('input[name="pagesNumber"]', "128")
    set_value('input[name="amazonLink"]', "http://pierre-gorin.fr/Amazon")
    set_value('input[name="kindleLink"]', "http://pierre-gorin.fr/Kindle")
    set_value('input[name="audibleLink"]', "http://pierre-gorin.fr/Audible")
    set_value('input[name="fnacLink"]', "http://pierre-gorin.fr/Fnac")

    # Pour le <select>, c'est un peu différent
    lang_select_js = 'document.querySelector("select[name=\'language\']").value = "fr"'
    driver.execute_script(lang_select_js)

    while True:
        pass

# Exécuter le test
test_programme()