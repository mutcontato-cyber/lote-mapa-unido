<?php
/**
 * Bot de Aniversários para Hospedagem Compartilhada (cPanel)
 * Coloque este arquivo no servidor e configure o Cron Job para rodar 1x por dia.
 * Exemplo de cron: php /home/seu_usuario/public_html/bot-aniversarios.php
 */

// ==========================================
// 1. CONFIGURAÇÕES (PREENCHA SEUS DADOS AQUI)
// ==========================================

// URL DO SEU SITE HOSPEDADO NO LOVABLE E A SENHA
$SITE_URL = "https://URL_DO_SEU_SITE_NO_LOVABLE";
$SITE_TOKEN = "minhasenha123";

// Configurações do Evolution API
$EVOLUTION_URL = "http://108.174.144.28"; // Adicionado http:// se faltar
$EVOLUTION_KEY = "f3c6c17df968667f658c847bdd0cf46d897e240cf3c954ba75a8fad684c11c65";
$EVOLUTION_INSTANCE = "admin";

// ==========================================
// FUNÇÕES AUXILIARES DE REQUISIÇÃO E DATA
// ==========================================

// FUNÇÕES AUXILIARES DE REQUISIÇÃO

function postRequest($url, $payload, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    
    $httpHeaders = ['Content-Type: application/json'];
    foreach ($headers as $k => $v) {
        $httpHeaders[] = "$k: $v";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $httpHeaders);
    
    $res = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'data' => json_decode($res, true)];
}

function getRequest($url, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $httpHeaders = ['Content-Type: application/json'];
    foreach ($headers as $k => $v) {
        $httpHeaders[] = "$k: $v";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $httpHeaders);
    
    $res = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'data' => json_decode($res, true)];
}

function deleteRequest($url, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
    
    $httpHeaders = ['Content-Type: application/json'];
    foreach ($headers as $k => $v) {
        $httpHeaders[] = "$k: $v";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $httpHeaders);
    
    $res = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'data' => json_decode($res, true)];
}

// ==========================================
// EXECUÇÃO PRINCIPAL
// ==========================================

date_default_timezone_set('America/Sao_Paulo');

echo "[".date('Y-m-d H:i:s')."] Iniciando rotina de aniversários via Lovable API...\n";

// 1. Chamar a API do seu site que já mastiga todos os dados!
$apiUrl = $SITE_URL . "/api/aniversariantes?token=" . urlencode($SITE_TOKEN);
$resDados = getRequest($apiUrl);

if ($resDados['status'] !== 200) {
    die("Falha ao comunicar com o Lovable App. Status: " . $resDados['status'] . "\nRetorno: " . json_encode($resDados['data']) . "\n");
}

$aniversariantesHoje = $resDados['data'];

if (empty($aniversariantesHoje)) {
    die("Nenhum aniversariante retornado pela API para hoje.\n");
}

echo "Encontrados " . count($aniversariantesHoje) . " aniversariantes hoje!\n";

// 2. Disparar Mensagens no Evolution API
foreach ($aniversariantesHoje as $user) {
    $nomeCurto = $user['nome'];
    $numFormatado = $user['telefone'];
    $mensagemFinal = $user['mensagem'];
    $isCustom = $user['customizada'];

    if ($isCustom) {
        echo "[CUSTOMIZADA] ";
    }

    echo "Enviando mensagem para $nomeCurto ($numFormatado)... ";

    $evoSendUrl = $EVOLUTION_URL . "/message/sendText/" . $EVOLUTION_INSTANCE;
    $evoRes = postRequest($evoSendUrl, [
        'number' => $numFormatado,
        'text' => $mensagemFinal
    ], [
        'apikey' => $EVOLUTION_KEY
    ]);

    if ($evoRes['status'] >= 200 && $evoRes['status'] < 300) {
        echo "Sucesso!\n";
        // Apagar a mensagem customizada caso tenha sido usada
        if ($isCustom) {
            $deleteUrl = $SITE_URL . "/api/apagar-customizada?token=" . urlencode($SITE_TOKEN);
            postRequest($deleteUrl, ['telefone' => $numFormatado]);
        }
    } else {
        echo "Falha! Status: " . $evoRes['status'] . "\n";
    }
}

echo "\nRotina finalizada.\n";
?>
