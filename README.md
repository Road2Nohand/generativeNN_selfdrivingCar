# NEAT : Evolving Neural Networks through Augmenting Topologies

Dieses Projekt ist stark inspiriert von Dr. Radu Mariescu-Istodo und erweitert um die Algorithmen des offiziellen NEAT Papers: https://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf

**Definition:** Der NEAT-Algorithmus ist ein genetischer Algorithmus zur Evolution künstlicher neuronaler Netze (ANNs). Er wurde von Kenneth O. Stanley und Risto Miikkulainen entwickelt und erstmals im Jahr 2002 im wissenschaftlichen Artikel "Evolving Neural Networks through Augmenting Topologies" vorgestellt.

## Funktionsweise

1. **Kodierung**
   Jedes neuronale Netz wird als Genom dargestellt, das aus einer Liste von Genen besteht. Jedes Gen enthält Informationen über Neuronen (Knoten) und Verbindungen (Kanten) zwischen diesen Neuronen.
2. **Innovation**
   Um das Problem der konkurrierenden Konvergenz zu vermeiden, verwendet NEAT das Konzept der Innovation. Jede neue Verbindung oder jedes neue Neuron erhält eine eindeutige Innovationsnummer. Diese Nummer hilft, unterschiedliche Mutationen im Laufe der Evolution konsistent zu halten. 
   Konkurrierende Konvergenz ist ein Phänomen, das in evolutionären Algorithmen auftritt, wenn verschiedene Lösungen oder Individuen in der Population gleichzeitig ähnliche Eigenschaften entwickeln. Dies kann dazu führen, dass die genetische Vielfalt in der Population abnimmt, wodurch der Suchraum eingeschränkt wird und die Evolution der Lösungen nicht optimal verläuft.
3. **Spezien**
   Die Population von neuronalen Netzen wird in Spezies unterteilt, die ähnliche Topologien aufweisen. Dadurch wird verhindert, dass neuartige Topologien zu früh aussterben, indem sie ihnen Zeit gibt, sich anzupassen.
4. **Selektion**
   Innerhalb jeder Spezies werden die Netze nach ihrer Fitness (d.h. ihrer Leistung in der gegebenen Aufgabe) bewertet. Die am besten bewerteten Netze jeder Spezies werden zur Fortpflanzung ausgewählt.
5. **Crossover**
   Bei der Fortpflanzung werden Gene von zwei Elternnetzen ausgewählt und kombiniert, um ein neues Kindnetz zu erstellen. Gene mit der gleichen Innovationsnummer (übereinstimmende Gene) werden zufällig ausgewählt, während nicht übereinstimmende Gene (disjunkt und überschüssig) vom fitteren Elternteil übernommen werden.
6. **Mutation**
   Nach dem Crossover kann das Kindnetz mutieren, wobei Änderungen an der Topologie und den Gewichten vorgenommen werden. Es gibt verschiedene Arten von Mutationen, wie das Hinzufügen oder Löschen von Verbindungen, das Hinzufügen oder Löschen von Neuronen oder das Ändern der Verbindungsgewichte.
7. **Generationswechsel**
   Nachdem genügend Nachkommen erstellt wurden, ersetzen sie die alte Population. Der Algorithmus wiederholt dann die Schritte 3-7, bis eine bestimmte Anzahl von Generationen erreicht ist oder die gewünschte Fitness erreicht wurde.

## Unterschied zu anderen NeuroEvo-Alg.

Der NEAT-Algorithmus verwendet sowohl die Struktur als auch die Gewichtungen der Verbindungen zwischen Neuronen, um optimale neuronale Netze für ein bestimmtes Problem zu entwickeln. Im Gegensatz zu anderen Neuroevolutionsansätzen, die entweder die Struktur oder die Gewichte der Netzwerke verändern, kombiniert NEAT beide Ansätze. Eine Besonderheit von NEAT ist die Verwendung eines "historischen Markierungssystems" (genannt Gene History), um das Problem des konkurrierenden Zusammenführens von Spezies (engl. "competing conventions problem") während der Kreuzung von verschiedenen Netzwerkstrukturen zu lösen.

Die Hauptbeiträge des Papers sind:

1. Eine Methode, um die Evolution von Netzwerkstrukturen zu ermöglichen, indem neue Knoten und Verbindungen schrittweise eingeführt werden.
2. Die Einführung eines historischen Markierungssystems (Gene History), das es ermöglicht, unterschiedliche Netzwerkstrukturen effektiv zu kreuzen, indem es Genomähnlichkeiten aufgrund ihrer historischen Herkunft erkennt.
3. Die Verwendung von Spezies, um die Vielfalt der Population aufrechtzuerhalten und das Problem der konkurrierenden Zusammenführung von Spezies zu lösen.
   In ihren Experimenten verglichen die Autoren NEAT mit anderen Neuroevolutionsansätzen, darunter fixe Topologien (FT), zufällige Topologien (RT) und die Evolution von Verbindungsgewichten und Topologien getrennt (WCCI). Die Ergebnisse zeigten, dass NEAT bessere Leistungen und eine schnellere Konvergenz erzielte als die anderen Ansätze.

Das Paper zeigt auch, dass NEAT erfolgreich komplexe Steuerungsaufgaben lösen kann, wie zum Beispiel das doppelt aufgehängte Pendel (Double Pole Balancing) und das doppelt aufgehängte Pendel mit Markov-Entscheidungsprozessen (Double Pole Balancing with Markov Decision Processes).

Insgesamt zeigt dieses Paper die Wirksamkeit des NEAT-Ansatzes in der Evolution künstlicher neuronaler Netze und legt den Grundstein für zukünftige Forschungen und Anwendungen in verschiedenen Bereichen der künstlichen Intelligenz und des maschinellen Lernens.

## Praxisanwendung

NEAT wird heute in der Praxis in verschiedenen Bereichen eingesetzt, wie zum Beispiel:

1. Spiele und Simulationen: NEAT kann zur Entwicklung künstlicher Intelligenzen für Spiele oder Simulationen verwendet werden, um Verhaltensweisen und Strategien zu optimieren.
2. Steuerung und Regelung: In der Robotik und anderen Steuerungsanwendungen kann NEAT zur Optimierung von Regelungsalgorithmen verwendet werden.
3. Mustererkennung: NEAT kann zur Klassifizierung und Vorhersage in der Datenanalyse oder zur Erkennung komplexer Muster in Datensätzen eingesetzt werden.
4. Optimierung: In Optimierungsproblemen kann NEAT verwendet werden, um Lösungen für komplexe Probleme zu entwickeln, die schwer mit herkömmlichen Optimierungsmethoden zu lösen sind.

Insgesamt ist der NEAT-Algorithmus ein flexibles Werkzeug für die Evolution künstlicher neuronaler Netze und wird in vielen Bereichen der künstlichen Intelligenz und des maschinellen Lernens eingesetzt.
