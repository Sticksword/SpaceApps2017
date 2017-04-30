import numpy as np
import requests
import cStringIO
import itertools
from collections import Counter
from PIL import Image

from scipy.sparse import coo_matrix


# CA only
lower_left = (-2465981, 1185123)  # Lon/Lat(-122.1233,30.6723)
upper_right = (-1641691, 2492832)  # Lon/Lat(-116.6495,43.8157)

base_url = "https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLFile?year=2016&bbox="

# tesselate the box
paging = 50000

# write header
with open('/private/tmp/pyf_test_agged.csv', 'w') as f:
    f.write("x,y,type,ct\n")

en = 0
done_boxes = set()

with open('/private/tmp/test_agged.csv', 'a') as fa:
    for x_i in range(lower_left[0], upper_right[0], paging):
        for y_i in range(lower_left[1], upper_right[1], paging):
            bbox_q = ",".join([str(i) for i in [x_i, y_i, x_i + paging, y_i + paging]])
            tile_count = Counter()
            if bbox_q in done_boxes:
                continue
            else:
                # get the data file link
                print("box:", bbox_q)
                print(base_url + bbox_q)
                resp = requests.get(base_url + bbox_q, verify=False)

                if "<returnURL>" in resp.text:
                    tiff_link = resp.text.split("<returnURL>")[-1].split("</returnURL>")[0]
                    print("got tiff link:", tiff_link)

                    # get the tiff file, convert to sparse matrix
                    img_resp = requests.get(tiff_link, verify=False)
                    img_file = cStringIO.StringIO(img_resp.content)
                    img_arr = coo_matrix(np.array(Image.open(img_file)))
                    img_arr.eliminate_zeros()

                    print("got tiff arr, shape:", img_arr.shape)

                    # determine x unit to pixel unit scaling
                    scale_unit = paging / float(img_arr.shape[1])

                    # iterate over non-zero elements in matrix
                    for yii, xii, v in itertools.izip(img_arr.row, img_arr.col, img_arr.data):
                        tile_count[v] += 1

                for v, ct in tile_count.items():
                    fa.write("{},{},{},{}\n".format(
                        x_i,
                        y_i,
                        v,
                        ct
                    ))
                else:
                    print("no data in box")

                print("box:", bbox_q)
                done_boxes.add(bbox_q)

            en += 1
            print("DONE WITH", en)
