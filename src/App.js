import { ethers } from 'ethers';
import React, {useEffect, useState} from 'react';
import './styles/App.css';

const tld = '.onion';
const CONTRACT_ADDRESS = '0xc807087615CdBF606fF31a9D3a5eAB86847c4170';
const App = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [domain, setDomain] = useState('');
  const [record, setRecord] = useState('');
  useEffect(()=>{
	checkIfWalletIsConnected()
  },[])

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

		if(accounts.length == 0)
		{
			console.log("no account found")
		}
		else
		{
			const account = accounts[0]
			console.log('Found', account);
			setCurrentAccount(account)
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
				const provider = await ethers.providers.Web3Provider(ethereum);
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
  const walletNotConnected = () => (
	<div className="connect-wallet-container">
		<img src="https://media.giphy.com/media/kE54wc0PNxtVJeARb5/giphy.gif" alt="Onion gif" />
		<button className="cta-button connect-wallet-button" onClick={connectWallet()}>
			Connect Wallet
		</button>
  	</div>
  )

  const formInput = () => {
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

			<div className="button-container">
				<button className='cta-button mint-button' disabled={null} onClick={null}>
					Mint
				</button>  
				<button className='cta-button mint-button' disabled={null} onClick={null}>
					Set data
				</button>  
			</div>
		</div>
	  )
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
					</header>
				</div>
				{!currentAccount && walletNotConnected()}
				{currentAccount && formInput()}
			</div>
		</div>
	);
}

export default App;
