import { ethers } from 'ethers';
import React, {useEffect, useState} from 'react';
import './styles/App.css';
import contractAbi from "./utils/contractAbi.json";
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';
const tld = '.onion';
const CONTRACT_ADDRESS = '0xc807087615CdBF606fF31a9D3a5eAB86847c4170';
const App = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [domain, setDomain] = useState('');
  const [record, setRecord] = useState('');
  const [network, setNetwork] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mints, setMints] = useState([]);

  useEffect(()=>{
	checkIfWalletIsConnected()
  },[])

  useEffect(() => {
	if (network === 'Polygon Mumbai Testnet') {
	  fetchMints();
	}
  }, [currentAccount, network]);

  const connectWallet = async() => {
	  try{
		  const {ethereum} = window;
		  if(!ethereum) {
			alert("Get MetaMask -> https://metamask.io/");
			return;
		  }
		  const accounts = await ethereum.request({method: "eth_requestAccounts"})
		  console.log('Connected', accounts[0]);
		  setCurrentAccount(accounts[0]);
	  }
	  catch(ex)
	  {
		  console.log('error',ex)
	  }
  }

  const switchNetwork = async () => {
	if (window.ethereum) {
	  try {
		await window.ethereum.request({
		  method: 'wallet_switchEthereumChain',
		  params: [{ chainId: '0x13881' }],
		});
	  } catch (error) {
		// This error code means that the chain we want has not been added to MetaMask
		// In this case we ask the user to add it to their MetaMask
		if (error.code === 4902) {
		  try {
			await window.ethereum.request({
			  method: 'wallet_addEthereumChain',
			  params: [
				{	
				  chainId: '0x13881',
				  chainName: 'Polygon Mumbai Testnet',
				  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
				  nativeCurrency: {
					  name: "Mumbai Matic",
					  symbol: "MATIC",
					  decimals: 18
				  },
				  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
				},
			  ],
			});
		  } catch (error) {
			console.log(error);
		  }
		}
		console.log(error);
	  }
	} else {
	  // If window.ethereum is not found then MetaMask is not installed
	  alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
	} 
  }
  const checkIfWalletIsConnected = async () => {
	  const { ethereum } = window;
	  if(!ethereum)
	  {
		console.log('Ethereum Wallet Not Connected');
		return;
	  }
	  else
	  {
		console.log("We have the ethereum object", ethereum)
		const accounts = await ethereum.request({method: 'eth_accounts'});

		if(accounts.length === 0)
		{
			console.log("no account found")
		}
		else
		{
			const account = accounts[0]
			console.log('Found', account);
			setCurrentAccount(account)
		}
		
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);
		ethereum.on('chainChanged', handleChainChanged);

		function handleChainChanged(_chainId) {
			window.location.reload();
		  }
	  }
  }

  const mintDomain = async() => {
	  if(!domain)
	  	{return;}
	  else
	  {
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}
		const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
		console.log("Minting domain", domain, "with price", price);
		try{
			const { ethereum } = window;
			if(ethereum)
			{
				const provider = await new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
				console.log("Going to pop wallet now to pay gas...")
				let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)})
				let receipt = await tx.wait();
				if(receipt.status === 1)
				{
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
					tx = await contract.setRecord(domain, record);
					await tx.wait();
					console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);
					setTimeout(() => {
						fetchMints();
					  }, 2000);
					setRecord('');	
					setDomain('');
				}
				else
				{
					alert("Transaction failed! Please try again");
				}
			}
		}
		catch(ex)
		{
			console.log(ex)
		}
	  }		  
  }

  const fetchMints = async() => {
	  try{
		const {ethereum} = window;
		if(ethereum)
		{
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

			const names = await contract.getAllNames();
			const mintRecords = await Promise.all(names.map(async(name)=> {
				const mintRecord = await contract.getRecord(name);
				const owner = await contract.getAddress(name);
				return {
					id: names.indexOf(name),
					name: name,
					record: mintRecord,
					owner: owner,
				  };
			}))
			console.log("MINTS FETCHED ", mintRecords);
			setMints(mintRecords);
		}
	  }
	  catch(ex)
	  {
		console.log(ex);
	  }
  }

  const updateDomain = async () => {
	  const {ethereum} = window;
	  if(!record || !domain)
	  {
		  return
	  }
	  setLoading(true);
	  if(ethereum){
		  try
		  {
			const Provider = new ethers.providers.Web3Provider(ethereum);
			const signer = await Provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
			let tx = await contract.setRecord(domain, record);
			await tx.wait();
			console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);
			fetchMints();
			setDomain('');
			setRecord('');
		  }
		  catch(ex)
		  {
			console.log(ex);
		  }
	  }
	  setLoading(false);
  }
  const walletNotConnected = () => (
	<div className="connect-wallet-container">
		<img src="https://media.giphy.com/media/kE54wc0PNxtVJeARb5/giphy.gif" alt="Onion gif" />
		<button className="cta-button connect-wallet-button" onClick={connectWallet()}>
			Connect Wallet
		</button>
  	</div>
  )

  const formInput = () => {
	  if (network !== 'Polygon Mumbai Testnet') {
			return (
			<div className="connect-wallet-container">
				<h2>Please switch to Polygon Mumbai Testnet</h2>
				{/* This button will call our switch network function */}
				<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
			</div>
			);
	  }
	  return (
		<div className="form-container">
			<div className="first-row">
				<input
					type="text"
					value={domain}
					placeholder='domain'
					onChange={e => setDomain(e.target.value)}
				/>
				<p className='tld'> {tld} </p>
			</div>

			<input
				type="text"
				value={record}
				placeholder='give skin to ur onion'
				onChange={e => setRecord(e.target.value)}
			/>

			{
				editing
				?
				<div className="button-container">
					<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
						Set Record
					</button>  
					<button className='cta-button mint-button' onClick={setEditing(false)}>
						Cancel
					</button>  
				</div>
				:
				<div className="button-container">
					<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
						Mint
					</button>
				</div>
			}
		</div>
	  )
  }

  const renderMints = () => {
	if (currentAccount && mints.length > 0) {
	  return (
		<div className="mint-container">
		  <p className="subtitle"> Recently minted domains!</p>
		  <div className="mint-list">
			{ mints.map((mint, index) => {
			  return (
				<div className="mint-item" key={index}>
				  <div className='mint-row'>
					<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
					  <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
					</a>
					{/* If mint.owner is currentAccount, add an "edit" button*/}
					{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
					  <button className="edit-button" onClick={() => editRecord(mint.name)}>
						<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
					  </button>
					  :
					  null
					}
				  </div>
			<p> {mint.record} </p>
		  </div>)
		  })}
		</div>
	  </div>);
	}
  };

  const editRecord = (name) => {
	console.log("Editing record for", name);
	setEditing(true);
	setDomain(name);
  }
  
  return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
						<div className="left">
						<p className="title">🧅 Onion Name Service</p>
						<p className="subtitle">Your immortal API on the blockchain!</p>
						</div>
						<div className="right">
							<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
							{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
    					</div>
					</header>
				</div>
				{!currentAccount && walletNotConnected()}
				{currentAccount && formInput()}
				{mints && renderMints()}
			</div>
		</div>
	);
}

export default App;
