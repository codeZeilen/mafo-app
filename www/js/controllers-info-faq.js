angular.module('starter.controllers')

.controller('EventInfoCtrl', function($scope, DataLanguage, $state, $ionicHistory) {

  var changeTemplate = function() {
    if(DataLanguage.currentLanguage() === 'en') {
      if($state.current.name !== 'app.infoEn') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.infoEn', {}, {'location' : 'replace'});
      }
    } else {
      if($state.current.name !== 'app.info') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.info', {}, {'location' : 'replace'});
      }
    }
  };

  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal !== newVal) {
      changeTemplate();
    }
  });
  changeTemplate();
})

.controller('FAQCtrl', function($scope, DataLanguage) {
  $scope.questions_de = [
    {
      question: "Wo kann ich einchecken?",
      answer : "Am Donnerstag, den 08.03., kannst Du ab 10:15 bis 13:30 bei SN169 in der Universität einchecken. Falls Du erst später in Mannheim ankommst geht dies auch abends vor der Eröffnung im Foyer des Nationaltheaters."
    },
    {
      question: "Was kann mein Namenskärtchen? Und wofür gibt es dieses Bändchen?",
      answer : "DDas Namenskärtchen gewährt Dir Einlass zu allen Veranstaltungen in der Universität, sowie zu den Veranstaltungen des Rahmenprogramms wie zum Beispiel dem Gala-Dinner im Baumhein. Wir bitten Dich während des gesamten Events das Namenskärtchen zu tragen."
    },{
      question: "Gibt es einen Dresscode?",
      answer : "Wir verzichten auf eine formale Kleiderordnung. Jedoch empfehlen wir, um den Charakter der Veranstaltung zu unterstützen, Kleidung während allen Veranstaltungen im Business Casual Stil zu tragen."
    },{
      question: "Welche Veranstaltungen kann ich besuchen?",
      answer : "Grundsätzlich steht allen Teilnehmern der Besuch der Hauptveranstaltungen sowie der Abendveranstaltungen offen. Auch die Verpflegung ist inklusive. An welchen Workshops Du teilnehmen kannst wurde Dir gesondert per E-Mail mitgeteilt."
    },{
      question: "Ich weiß nicht mehr zu welchen Veranstaltungen ich mich angemeldet habe. Was mache ich jetzt?",
      answer : "Fragen zu deinen Workshops und alle anderen Fragen zu dem Event können Dir am Info-Point zwischen den SN-Räumen beantwortet werden."
    },{
      question: "Was mache ich, wenn ich es nicht pünktlich zu einer Veranstaltung schaffe?",
      answer : "Wir bitten alle Teilnehmer um Pünktlichkeit, um die jeweilige Veranstaltung nicht zu stören. "
    },{
      question: "Was muss ich zum Check-In mitbringen",
      answer : "Beim Check-In brauchen wir nur Deinen Ausweis, um sicherzugehen, dass nur der Ticketinhaber sein Namenskärtchen bekommt."
    },{
      question: "Was muss ich zu den Workshops mitbringen?",
      answer : "Wir informieren Dich darüber, falls Du zu Deinem Workshop bestimmte Geräte, wie zum Beispiel einen Laptop, mitbringen solltest. Ansonsten ist es nur wichtig, dass Du Dein Namenskärtchen dabei hast."
    },{
      question: "Kann ich persönlich mit den Rednern/Moderatoren sprechen?",
      answer : "Ein persönliches Gespräch wird wahrscheinlich nicht möglich sein. Um Deine Fragen an die Referenten loszuwerden kannst Du aber die Fragerunden, die es gewöhnlich am Ende der Hauptveranstaltungen gibt, nutzen."
    },{
      question: "Gibt es Anwesenheitspflicht?",
      answer : "Nein. Wir würden Dich allerdings bitten, zu den Workshops zu erscheinen, für die Du uns eine positive Rückmeldung gegeben hast. Falls Du nicht an einem Workshop teilnehmen kannst, gebe uns bitte so früh wie möglich Bescheid. Dann können Teilnehmer auf den Wartelisten die Chance bekommen nachzurücken. "
    },{
      question: "Wer ist mein Ansprechpartner für sonstige Fragen und Probleme?",
      answer : "Wir sind vor und während des Events immer unter participants@mannheim-forum.org zu erreichen. Zudem kannst Du dich mit allen Fragen an uns am Info-Point zwischen den SN-Räumen wenden sowie an alle Mitglieder des Teams denen Du begegnest. Bei absolut dringenden Umständen und Notfällen sind wir auch unter unserer Hotline zu erreichen."
    },{
      question: "Wann und wo bekomme ich etwas zu essen?",
      answer : "Am Freitag gibt es von 12:00-16:00 ein Angebot an Finger Food und Kuchen im Hays Forum. Abends findet dann das Gala Dinner im Baumhain statt mit einem umfangreichen Gänge-Menü. Am Samstag wird es von 12:00-14:00 Mittagessen im Hays Forum geben."
    },{
      question: "Was ist das Mannheim Forum Casino?",
      answer : "An zwei Veranstaltungstagen hast Du die Möglichkeit, mit unseren Partnerunternehmen in Kontakt zu treten und Dich über Karrieremöglichkeiten oder das Unternehmen allgemein zu informieren."
    },{
      question: "Wie bekomme ich während des Events die wichtigsten Informationen und Änderungen mit?",
      answer : "Über unseren App-Newsticker erfährst Du alle Änderungen und wichtigen Ereignisse. Am besten folgst Du uns zudem auf unseren Social-Media-Kanälen: Facebook, Snapchat, Instagram und Twitter, um immer auf dem laufenden zu bleiben. Falls es noch wichtige Updates zu einem Deiner Workshops gibt, werden wir Dich auch persönlich per Mail kontaktieren."
    }
  ];

  $scope.questions_en = [
    {
      question: "Where can I check-in?",
      answer : "At the Check-in station in O 048 – the right way will be signposted. The check-in is open on Saturday from 08 to 11 am."
    },{
      question: "What is the nametag and the red wristband for? What happens if I lose it?",
      answer : "The nametag is your ticket to all events during the day. The wristband is your ticket to the closing party at Tiffany Club. Neither of them will be reissued, so please don’t lose either of them ;)"
    },{
      question: "Is there a dresscode?",
      answer : "There is no official, formal dresscode. However we suggest serious clothing during all events, based on the so-called „business casual“ to maintain and support the character of the event."
    },{
      question: "Which events can I go to?",
      answer : "You can go to the English main discussion (Mannheim Forum Spezial) as well as the workshop you received a separate email about. Of course, you can use every opportunity to eat and drink that we offer (lunch, coffee/cake in the afternoon) as well as go to our closing party at Tiffany Club if you have your wristband ready. We informed you about the workshop you can go to separately via email. If you forgot which workshop that was you can ask at the info-point."
    },{
      question: "What happens if I come to an event late or if it is full?",
      answer : "In case you are late you might miss the best part. However you can sneak in also after it already started if there is still seats available. You will be informed about that at the entrance. If there is no space left you can go to the Mannheim Forum Lounge and watch the live cast."
    },{
      question: "Do I need to bring my confirmation email to check-in or to the workshop?",
      answer : "No, simply come to the check-in and line up in the right queue (sorted according to last names). You will be asked to tell us your name and/or to show a valid ID card. The workshop speakers know that you are coming so you don’t need any proof of admittance."
    },{
      question: "Can I talk to speakers/moderators personally?",
      answer : "A personal discussion will probably not be possible. However there’s usually the chance to ask questions in the end of each event. Please use that opportunity."
    },{
      question: "Whom can I ask in case of questions?",
      answer : "Please call +49 (0) 157 54812371 if you need anything or if you have any questions. We can help you with basically everything."
    },{
      question: "Hungry – where and when can I eat?",
      answer : "There’s a lunch buffet on Saturday between 12 am and 2 pm at the Katakomben. In the afternoon there will be coffee and cake."
    },{
      question: "What is the Mannheim Forum Kasino? How can I prepare?",
      answer : "From 10 am to 2 pm you will have the chance to meet our corporate partners personally at the Kasino, which works somewhat like a career fair. Our partners are available at various fair stands at the Aula and look forward to answer your questions about the corporations and career possibilities. Check out our partner page to see who you can meet!"
    },{
      question: "How am I informed in case of changes/news?",
      answer : "Just keep following our newsticker within this App. All important information will be communicated there. Don’t worry if there will be some messages only in German – all information relevant to you will be translated and displayed in English."
    }
  ];

  var updateQuestions = function() {
    if(DataLanguage.currentLanguage() === 'en') {
      $scope.questions = $scope.questions_en;
    } else {
      $scope.questions = $scope.questions_de;
    }
  };
  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal !== newVal) {
      updateQuestions();
    }
  });
  updateQuestions();


});
