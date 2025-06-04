import requests
import py3Dmol

def show_molecule_3d(name):
    # Step 1: Get CID (Compound ID) for the molecule
    cid_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/cids/JSON"
    cid_res = requests.get(cid_url)
    cid = cid_res.json()["IdentifierList"]["CID"][0]

    # Step 2: Download 3D structure as SDF
    sdf_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/record/SDF/?record_type=3d"
    sdf_data = requests.get(sdf_url).text

    # Step 3: Visualize using py3Dmol
    viewer = py3Dmol.view(width=400, height=400)
    viewer.addModel(sdf_data, "sdf")
    viewer.setStyle({'stick': {}})
    viewer.zoomTo()
    viewer.show()

# 🔬 Try a molecule
show_molecule_3d("glucose")
